"""Unit tests for PDF password generation rules and PDF encryption utility.

Rules:
PASSWORD = FIRST 4 CHARACTERS OF NAME (UPPERCASE) + BIRTH YEAR
"""

from datetime import date, datetime
import io
import pytest
import PyPDF2
import pypdfium2 as pdfium
from reportlab.pdfgen import canvas

from src.core.exceptions import ProtectedReportError
from src.features.report_extraction.pdf_protection import (
    encrypt_pdf,
    generate_pdf_password,
)


def test_password_subodh_2005():
    """1. Subodh + DOB 2005 → SUBO2005"""
    pwd = generate_pdf_password("Subodh", date(2005, 8, 15))
    assert pwd == "SUBO2005"


def test_password_rahul_1999():
    """2. Rahul + DOB 1999 → RAHU1999"""
    pwd = generate_pdf_password("Rahul", date(1999, 3, 21))
    assert pwd == "RAHU1999"


def test_password_full_name_subodh_walondre():
    """Subodh Walondre + DOB 2005 → SUBO2005"""
    pwd = generate_pdf_password("Subodh Walondre", "2005-08-15")
    assert pwd == "SUBO2005"


def test_password_name_shorter_than_4_chars():
    """3. Name shorter than 4 characters: Ali + 2010 → ALI2010"""
    pwd = generate_pdf_password("Ali", date(2010, 5, 1))
    assert pwd == "ALI2010"

    pwd_two = generate_pdf_password("Al", date(2010, 5, 1))
    assert pwd_two == "AL2010"


def test_password_name_with_leading_trailing_spaces():
    """4. Name containing leading/trailing spaces: '  subodh  ' → SUBO2005"""
    pwd = generate_pdf_password("  subodh  ", date(2005, 8, 15))
    assert pwd == "SUBO2005"


def test_password_missing_dob_raises():
    """5. Missing DOB raises ProtectedReportError"""
    with pytest.raises(ProtectedReportError, match="Date of birth is required"):
        generate_pdf_password("Subodh", None)

    with pytest.raises(ProtectedReportError, match="Date of birth is required"):
        generate_pdf_password("Subodh", "")


def test_password_missing_name_raises():
    """6. Missing name raises ProtectedReportError"""
    with pytest.raises(ProtectedReportError, match="Patient profile name is required"):
        generate_pdf_password(None, date(2005, 8, 15))

    with pytest.raises(ProtectedReportError, match="Patient profile name is required"):
        generate_pdf_password("   ", date(2005, 8, 15))


def test_encrypt_pdf_with_valid_password():
    """Test encrypt_pdf creates standard encrypted PDF requiring the password."""
    # Create sample PDF in memory
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 750, "Sample Medical Lab Result: Hemoglobin 14.5 g/dL")
    c.save()
    raw_bytes = buf.getvalue()

    password = "SUBO2005"
    encrypted_bytes = encrypt_pdf(raw_bytes, password)

    # 1. Verify file is encrypted via PyPDF2
    reader = PyPDF2.PdfReader(io.BytesIO(encrypted_bytes))
    assert reader.is_encrypted is True

    # 2. Verify incorrect password fails
    assert reader.decrypt("WRONGPASS") == 0

    # 3. Verify correct password succeeds
    assert reader.decrypt(password) in (1, 2)

    # 4. Verify opening via pypdfium2 (Chrome/Edge PDF engine) fails without password
    with pytest.raises(Exception):
        pdfium.PdfDocument(encrypted_bytes)

    # 5. Verify opening via pypdfium2 succeeds with correct password
    doc = pdfium.PdfDocument(encrypted_bytes, password=password)
    assert len(doc) == 1
    text = doc[0].get_textpage().get_text_range()
    assert "Hemoglobin" in text
