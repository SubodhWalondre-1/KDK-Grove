import asyncio
import json
import logging
import os
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from src.config import get_settings
from src.core.constants import (
    ALLOWED_UPLOAD_EXTENSIONS,
    MAX_UPLOAD_SIZE_MB,
    REPORT_STATUS_COMPLETED,
    REPORT_STATUS_FAILED,
    REPORT_STATUS_PROCESSING,
)
from src.core.exceptions import (
    FileTooLargeError,
    InvalidFileTypeError,
    ReportNotFoundError,
)
from src.core.severity import calculate_health_score, get_status_color
from src.features.report_extraction.llm_extraction import extract_structured_data
from src.features.report_extraction.ocr_pipeline import run_ocr
from src.features.species_support.service import resolve_canonical_test_name
from src.models.missing_reference_log import MissingReferenceLog
from src.models.reference_range import ReferenceRange
from src.models.report import Report, ReportTestValue
from src.services.image_preprocessing import preprocess_image

logger = logging.getLogger(__name__)

MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024


def process_report_upload(db: Session, profile_id: int, user_id: int, uploaded_file: UploadFile) -> Report:
    """Orchestrate F1: validate → save original → preprocess → OCR/PDF extract → LLM extract → persist."""
    _validate_upload(uploaded_file)

    report = Report(
        profile_id=profile_id,
        status=REPORT_STATUS_PROCESSING,
        original_file_path="",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    try:
        report_dir = _build_report_dir(user_id, profile_id, report.id)
        filename = uploaded_file.filename or ""
        ext = os.path.splitext(filename)[1].lower()

        pdf_extracted_text = None
        if ext == ".pdf":
            pdf_path = os.path.join(report_dir, "original.pdf")
            _save_uploaded_file(uploaded_file, pdf_path)
            original_path = os.path.join(report_dir, "original.jpg")
            pdf_extracted_text = _convert_pdf_to_image_and_extract_text(pdf_path, original_path)
            report.original_file_path = original_path
        else:
            original_path = os.path.join(report_dir, "original.jpg")
            _save_uploaded_file(uploaded_file, original_path)
            # Defensively check if uploaded "image" is actually a PDF (e.g. uploaded pdf saved as jpg)
            original_path, pdf_extracted_text = _ensure_valid_image(original_path, report_dir)
            report.original_file_path = original_path

        _run_extraction_pipeline(db, report, report_dir, pdf_text=pdf_extracted_text)

    except Exception:
        report.status = REPORT_STATUS_FAILED
        db.commit()
        raise

    return report


def reprocess_report(db: Session, report_id: int) -> Report:
    """Re-run steps 4-8 using the already-saved original image or PDF."""
    report = _fetch_report_or_raise(db, report_id)

    db.query(ReportTestValue).filter(ReportTestValue.report_id == report_id).delete()
    report.status = REPORT_STATUS_PROCESSING
    report.health_score = None
    db.commit()

    try:
        report_dir = os.path.dirname(report.original_file_path)
        original_path, pdf_text = _ensure_valid_image(report.original_file_path, report_dir)
        report.original_file_path = original_path

        _run_extraction_pipeline(db, report, report_dir, pdf_text=pdf_text)

    except Exception:
        report.status = REPORT_STATUS_FAILED
        db.commit()
        raise

    return report


def _convert_pdf_to_image_and_extract_text(pdf_path: str, output_jpg_path: str) -> str | None:
    """Render PDF pages to JPEG image and extract embedded text using pypdfium2."""
    import pypdfium2 as pdfium
    from PIL import Image

    try:
        pdf = pdfium.PdfDocument(pdf_path)
        images = []
        text_chunks = []

        for page in pdf:
            textpage = page.get_textpage()
            page_text = textpage.get_text_range()
            if page_text and page_text.strip():
                text_chunks.append(page_text.strip())

            img = page.render(scale=2.0).to_pil()
            images.append(img)

        if images:
            if len(images) == 1:
                images[0].convert("RGB").save(output_jpg_path, "JPEG")
            else:
                widths, heights = zip(*(img.size for img in images))
                total_height = sum(heights)
                max_width = max(widths)
                combined = Image.new("RGB", (max_width, total_height), (255, 255, 255))
                y_offset = 0
                for img in images:
                    combined.paste(img, (0, y_offset))
                    y_offset += img.size[1]
                combined.save(output_jpg_path, "JPEG")

        combined_text = "\n".join(text_chunks)
        return combined_text if len(combined_text.strip()) > 20 else None
    except Exception as exc:
        logger.warning("Failed to render PDF %s or extract text: %s", pdf_path, exc)
        return None


def _ensure_valid_image(original_path: str, report_dir: str) -> tuple[str, str | None]:
    """Ensure original.jpg is a valid image; if original.pdf is present, extract PDF text and render JPEG."""
    extracted_text = None
    if os.path.exists(original_path):
        try:
            with open(original_path, "rb") as f:
                header = f.read(10)
            if header.startswith(b"%PDF"):
                pdf_path = os.path.join(report_dir, "original.pdf")
                if not os.path.exists(pdf_path):
                    os.rename(original_path, pdf_path)
                else:
                    os.remove(original_path)
                extracted_text = _convert_pdf_to_image_and_extract_text(pdf_path, original_path)
                return original_path, extracted_text
        except Exception as exc:
            logger.warning("Error checking header of %s: %s", original_path, exc)

    pdf_path = os.path.join(report_dir, "original.pdf")
    if os.path.exists(pdf_path):
        extracted_text = _convert_pdf_to_image_and_extract_text(pdf_path, original_path)
        return original_path, extracted_text

    return original_path, None


def _run_extraction_pipeline(db: Session, report: Report, report_dir: str, pdf_text: str | None = None) -> None:
    """Shared extraction pipeline used by both upload and reprocess paths."""
    preprocessed_path = os.path.join(report_dir, "preprocessed.jpg")
    preprocess_image(report.original_file_path, preprocessed_path)
    report.preprocessed_file_path = preprocessed_path

    if pdf_text and pdf_text.strip():
        raw_text = pdf_text
    else:
        raw_text = run_ocr(preprocessed_path)

    ocr_output_path = os.path.join(report_dir, "ocr_raw_output.txt")
    Path(ocr_output_path).write_text(raw_text, encoding="utf-8")
    report.ocr_raw_text = raw_text

    profile = report.profile
    species = profile.species if profile else "human"
    gender = profile.gender if profile else None
    species_category = (
        profile.species_category
        if (profile and profile.species_category)
        else normalize_species_to_category(species)
    )

    try:
        extracted_tests = asyncio.run(
            extract_structured_data(raw_text, species_category)
        )
    except Exception as exc:
        logger.warning("Structured extraction failed (%s), attempting heuristic extraction fallback", exc)
        from src.features.report_extraction.llm_extraction import extract_with_heuristics
        extracted_tests = extract_with_heuristics(raw_text)
        if not extracted_tests:
            raise

    extracted_json_path = os.path.join(report_dir, "extracted_data.json")
    Path(extracted_json_path).write_text(
        json.dumps(extracted_tests, indent=2), encoding="utf-8"
    )

    test_value_rows = []
    for test_dict in extracted_tests:
        raw_name = test_dict["test_name"]
        canonical_name = resolve_canonical_test_name(raw_name, species_category, db)

        ref_low, ref_high = _lookup_reference_range(
            db, species, canonical_name, gender=gender
        )
        val = test_dict.get("value")
        computed_ref_low = ref_low if ref_low is not None else test_dict.get("ref_low")
        computed_ref_high = ref_high if ref_high is not None else test_dict.get("ref_high")
        computed_status = None
        if val is not None:
            computed_status = get_status_color(val, computed_ref_low, computed_ref_high)

        test_value_rows.append(
            ReportTestValue(
                report_id=report.id,
                test_name=canonical_name,
                value=val,
                unit=test_dict.get("unit"),
                ref_low=computed_ref_low,
                ref_high=computed_ref_high,
                status=computed_status,
            )
        )

    db.add_all(test_value_rows)
    _finalize_report(db, report)


def _finalize_report(db: Session, report: Report) -> None:
    """Set health_score and status to completed — single source of truth for both paths."""
    db.flush()
    db.refresh(report)
    report.health_score = calculate_health_score(report.test_values)
    report.status = REPORT_STATUS_COMPLETED
    db.commit()
    db.refresh(report)

    # Automatically generate RAG recommendations upon analysis completion
    try:
        from src.features.recommendations.service import generate_recommendations
        generate_recommendations(db, report.id, force_regenerate=True)
    except Exception as exc:
        logger.warning("Auto-generation of recommendations for report %d failed: %s", report.id, exc)

    # Automatically generate Personalized Diet Plan upon analysis completion
    try:
        from src.features.recommendations.diet_service import generate_diet_plan
        generate_diet_plan(db, report.id, force_regenerate=True)
    except Exception as exc:
        logger.warning("Auto-generation of diet plan for report %d failed: %s", report.id, exc)


def get_report_status(db: Session, report_id: int) -> str:
    report = _fetch_report_or_raise(db, report_id)
    return report.status


def get_report_detail(db: Session, report_id: int) -> Report:
    report = (
        db.query(Report)
        .options(joinedload(Report.test_values))
        .filter(Report.id == report_id)
        .first()
    )
    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")
    return report


def correct_report_values(db: Session, report_id: int, corrections: list[dict]) -> Report:
    """Update specific ReportTestValue rows; force is_manually_corrected=True server-side."""
    report = get_report_detail(db, report_id)

    correction_map = {c["id"]: c for c in corrections}
    for test_value in report.test_values:
        if test_value.id in correction_map:
            updates = correction_map[test_value.id]
            if "value" in updates:
                test_value.value = updates["value"]
            if "unit" in updates:
                test_value.unit = updates["unit"]
            if "ref_low" in updates:
                test_value.ref_low = updates["ref_low"]
            if "ref_high" in updates:
                test_value.ref_high = updates["ref_high"]
            test_value.is_manually_corrected = True
            if test_value.value is not None:
                test_value.status = get_status_color(test_value.value, test_value.ref_low, test_value.ref_high)

    report.health_score = calculate_health_score(report.test_values)
    db.commit()
    db.refresh(report)
    return report


def _validate_upload(uploaded_file: UploadFile) -> None:
    filename = uploaded_file.filename or ""
    extension = os.path.splitext(filename)[1].lower()
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        raise InvalidFileTypeError(
            detail=f"File type '{extension}' is not allowed. Accepted: {ALLOWED_UPLOAD_EXTENSIONS}"
        )

    uploaded_file.file.seek(0, 2)
    file_size = uploaded_file.file.tell()
    uploaded_file.file.seek(0)
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise FileTooLargeError(
            detail=f"File exceeds {MAX_UPLOAD_SIZE_MB}MB limit"
        )


def _build_report_dir(user_id: int, profile_id: int, report_id: int) -> str:
    settings = get_settings()
    report_dir = os.path.join(
        settings.upload_dir, str(user_id), str(profile_id), str(report_id)
    )
    os.makedirs(report_dir, exist_ok=True)
    return report_dir


def _save_uploaded_file(uploaded_file: UploadFile, destination: str) -> None:
    content = uploaded_file.file.read()
    Path(destination).write_bytes(content)


def _lookup_reference_range(
    db: Session, species: str, test_name: str, gender: str | None = None
) -> tuple[float | None, float | None]:
    query = db.query(ReferenceRange).filter(
        func.lower(ReferenceRange.species) == func.lower(species),
        func.lower(ReferenceRange.test_name) == func.lower(test_name),
    )

    if gender and gender.lower() in ("male", "female"):
        gender_ref = query.filter(func.lower(ReferenceRange.gender) == gender.lower()).first()
        if gender_ref is not None:
            return gender_ref.range_low, gender_ref.range_high

    ref = query.filter(func.lower(ReferenceRange.gender) == "any").first() or query.first()

    if ref is None:
        _log_missing_reference(db, species, test_name)
        return None, None

    return ref.range_low, ref.range_high


def _log_missing_reference(db: Session, species: str, test_name: str) -> None:
    try:
        entry = MissingReferenceLog(species=species, test_name=test_name)
        db.add(entry)
    except Exception as exc:
        logger.warning(
            "Failed to log missing reference for %s/%s: %s",
            species,
            test_name,
            exc,
        )


def _fetch_report_or_raise(db: Session, report_id: int) -> Report:
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")
    return report
