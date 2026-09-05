"""Password-protected PDF download and encryption service.

Implements Aadhaar-style PDF password protection:
PASSWORD = FIRST 4 CHARACTERS OF NAME (UPPERCASE) + 4-DIGIT BIRTH YEAR
"""

from datetime import date, datetime
import io
import os
from pathlib import Path
import re
from typing import Optional

from PIL import Image
try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    from PyPDF2 import PdfReader, PdfWriter  # type: ignore

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from src.core.exceptions import ProtectedReportError
from src.models.report import Report


def generate_pdf_password(name: Optional[str], dob: Optional[date | datetime | str]) -> str:
    """Derive the PDF password from patient name and date of birth.

    Rule: FIRST 4 CHARACTERS OF NAME (UPPERCASE) + 4-DIGIT BIRTH YEAR
    - Names are stripped of unnecessary whitespace.
    - Names shorter than 4 characters use all normalized characters.
    - DOB must be a valid date, datetime, or ISO/standard date string.
    """
    if not name or not str(name).strip():
        raise ProtectedReportError(detail="Patient profile name is required to generate the protected report.")

    # Normalize name: remove all spaces, take up to first 4 chars
    clean_name = "".join(str(name).strip().split())
    # Keep alphanumeric characters if available, else standard clean
    alpha_chars = re.sub(r"[^A-Za-z0-9]", "", clean_name)
    target_str = alpha_chars if alpha_chars else clean_name
    prefix = target_str[:4].upper()

    if not prefix:
        raise ProtectedReportError(detail="Patient profile name is invalid for password generation.")

    if dob is None:
        raise ProtectedReportError(detail="Date of birth is required to generate the protected report.")

    birth_year = None
    if isinstance(dob, (date, datetime)):
        birth_year = f"{dob.year:04d}"
    elif isinstance(dob, str):
        dob_str = dob.strip()
        if not dob_str:
            raise ProtectedReportError(detail="Date of birth is required to generate the protected report.")

        # Try parsing standard formats
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y", "%m/%d/%Y"):
            try:
                dt = datetime.strptime(dob_str, fmt)
                birth_year = f"{dt.year:04d}"
                break
            except ValueError:
                continue

        # Regex fallback for 4-digit year (1900-2099)
        if not birth_year:
            m = re.search(r"\b(19\d{2}|20\d{2})\b", dob_str)
            if m:
                birth_year = m.group(1)

    if not birth_year:
        raise ProtectedReportError(detail="Invalid date of birth format for generating the protected report.")

    return f"{prefix}{birth_year}"


def encrypt_pdf(input_pdf_bytes: bytes, password: str) -> bytes:
    """Encrypt PDF bytes using standard PDF encryption with user password."""
    if not input_pdf_bytes:
        raise ProtectedReportError(detail="Cannot encrypt an empty PDF document.")
    if not password:
        raise ProtectedReportError(detail="Password cannot be empty.")

    reader = PdfReader(io.BytesIO(input_pdf_bytes))
    writer = PdfWriter()

    # If the original PDF was already encrypted with an empty/default password, attempt decrypt
    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception:
            pass

    for page in reader.pages:
        writer.add_page(page)

    # Set user password (required to open document)
    writer.encrypt(user_password=password)

    output_stream = io.BytesIO()
    writer.write(output_stream)
    return output_stream.getvalue()


def build_or_get_report_pdf(report: Report) -> bytes:
    """Retrieve existing uploaded PDF, convert uploaded image, or generate Mediora PDF summary."""
    report_dir = os.path.dirname(report.original_file_path) if report.original_file_path else None

    # Check 1: original.pdf in report directory
    if report_dir:
        pdf_path = os.path.join(report_dir, "original.pdf")
        if os.path.exists(pdf_path):
            try:
                return Path(pdf_path).read_bytes()
            except Exception:
                pass

    # Check 2: original_file_path itself is a PDF
    if report.original_file_path and report.original_file_path.lower().endswith(".pdf"):
        if os.path.exists(report.original_file_path):
            try:
                return Path(report.original_file_path).read_bytes()
            except Exception:
                pass

    # Check 3: Image exists -> convert to PDF
    image_candidates = []
    if report.original_file_path:
        image_candidates.append(report.original_file_path)
    if report_dir:
        image_candidates.append(os.path.join(report_dir, "original.jpg"))
        image_candidates.append(os.path.join(report_dir, "preprocessed.jpg"))

    for img_path in image_candidates:
        if img_path and os.path.exists(img_path):
            try:
                with Image.open(img_path) as img:
                    pdf_buf = io.BytesIO()
                    img.convert("RGB").save(pdf_buf, format="PDF")
                    return pdf_buf.getvalue()
            except Exception:
                continue

    # Check 4: Dynamic generation using ReportLab
    return _generate_summary_pdf(report)


def _generate_summary_pdf(report: Report) -> bytes:
    """Dynamically generate a clean medical report PDF using ReportLab."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    p.setFont("Helvetica-Bold", 18)
    p.drawString(50, height - 50, "Mediora — Medical Laboratory Report")
    p.setLineWidth(1)
    p.line(50, height - 55, width - 50, height - 55)

    # Patient & Report Metadata
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, height - 80, "Patient Details:")
    p.setFont("Helvetica", 10)

    profile = report.profile
    profile_name = profile.profile_name if profile else "Patient"
    species = profile.species if profile else "human"
    gender = profile.gender if profile and profile.gender else "N/A"
    dob_str = str(profile.date_of_birth) if profile and profile.date_of_birth else "N/A"

    p.drawString(50, height - 100, f"Name: {profile_name}")
    p.drawString(250, height - 100, f"Species: {species}")
    p.drawString(400, height - 100, f"Gender: {gender}")

    report_date_str = str(report.report_date or report.uploaded_at.date() if report.uploaded_at else "N/A")
    health_score_str = f"{report.health_score:.1f}" if report.health_score is not None else "Pending"

    p.drawString(50, height - 118, f"Date of Birth: {dob_str}")
    p.drawString(250, height - 118, f"Report Date: {report_date_str}")
    p.drawString(400, height - 118, f"Health Score: {health_score_str} / 100")

    p.line(50, height - 130, width - 50, height - 130)

    # Test Results Table Header
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, height - 155, "Test Description")
    p.drawString(240, height - 155, "Result")
    p.drawString(320, height - 155, "Unit")
    p.drawString(400, height - 155, "Reference Range")
    p.drawString(510, height - 155, "Status")

    p.setLineWidth(0.5)
    p.line(50, height - 160, width - 50, height - 160)

    # Test Values Rows
    y = height - 180
    p.setFont("Helvetica", 9)
    test_values = report.test_values if report.test_values else []

    for tv in test_values:
        if y < 60:
            p.showPage()
            y = height - 50
            p.setFont("Helvetica", 9)

        ref_str = f"{tv.ref_low} - {tv.ref_high}" if tv.ref_low is not None and tv.ref_high is not None else "N/A"
        val_str = str(tv.value) if tv.value is not None else "N/A"
        unit_str = str(tv.unit or "")
        status_str = str(tv.status or "normal").upper()

        p.drawString(50, y, str(tv.test_name)[:30])
        p.drawString(240, y, val_str)
        p.drawString(320, y, unit_str[:12])
        p.drawString(400, y, ref_str)
        p.drawString(510, y, status_str)
        y -= 20

    # Footer
    p.setFont("Helvetica-Oblique", 8)
    p.drawString(50, 30, "Generated by Mediora Diagnostic Engine. Confidential Medical Record.")
    p.showPage()
    p.save()
    return buffer.getvalue()
