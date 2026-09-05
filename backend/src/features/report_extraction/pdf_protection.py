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


def generate_pdf_password(
    name: Optional[str],
    dob: Optional[date | datetime | str] = None,
    user_name: Optional[str] = None,
) -> str:
    """Derive the PDF password from patient name (DOB not required).

    Rule: PATIENT NAME IN UPPERCASE (first clean alphanumeric word).
    - Date of birth is no longer required.
    - Names are stripped of unnecessary whitespace and punctuation.
    - If profile name is missing, falls back to user_name.
    """
    candidate = name or user_name
    if not candidate or not str(candidate).strip():
        raise ProtectedReportError(detail="Patient profile name is required to generate the protected report.")

    raw_str = str(candidate).strip()
    first_token = raw_str.split()[0]
    clean_token = re.sub(r"[^A-Za-z0-9]", "", first_token)

    if not clean_token:
        alpha_words = re.findall(r"[A-Za-z0-9]+", raw_str)
        clean_token = alpha_words[0] if alpha_words else "MEDIORAPDF"

    return clean_token.upper()


def encrypt_pdf(input_pdf_bytes: bytes, password: str) -> bytes:
    """Encrypt PDF bytes using standard PDF encryption with user and owner passwords.

    Supports both UPPERCASE and lowercase inputs:
    - user_password is set to uppercase (e.g. 'SUBODH')
    - owner_password is set to lowercase (e.g. 'subodh')
    Both passwords unlock and open the document in all standard PDF viewers.
    """
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

    user_pwd = password.upper()
    owner_pwd = password.lower()
    if owner_pwd == user_pwd:
        owner_pwd = f"{user_pwd}_owner"

    # Set user and owner passwords with 128-bit AES encryption
    writer.encrypt(user_password=user_pwd, owner_password=owner_pwd, use_128bit=True)

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
