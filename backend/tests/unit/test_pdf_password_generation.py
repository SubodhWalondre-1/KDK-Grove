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


def test_password_subodh():
    """1. Subodh (without DOB or with DOB) → SUBODH"""
    pwd = generate_pdf_password("Subodh")
    assert pwd == "SUBODH"

    pwd_with_dob = generate_pdf_password("Subodh", date(2005, 8, 15))
    assert pwd_with_dob == "SUBODH"


def test_password_rahul():
    """2. Rahul → RAHUL"""
    pwd = generate_pdf_password("Rahul")
    assert pwd == "RAHUL"


def test_password_full_name_subodh_walondre():
    """Subodh Walondre → SUBODH (first word)"""
    pwd = generate_pdf_password("Subodh Walondre")
    assert pwd == "SUBODH"


def test_password_animal_patient_profile():
    """Animal Patient (dog) → ANIMAL"""
    pwd = generate_pdf_password("Animal Patient (dog)")
    assert pwd == "ANIMAL"


def test_password_pet_daisy():
    """Daisy → DAISY"""
    pwd = generate_pdf_password("Daisy")
    assert pwd == "DAISY"


def test_password_name_with_leading_trailing_spaces():
    """Name containing leading/trailing spaces: '  subodh  ' → SUBODH"""
    pwd = generate_pdf_password("  subodh  ")
    assert pwd == "SUBODH"


def test_password_dob_not_required():
    """DOB is not required; works when dob is None or empty string."""
    assert generate_pdf_password("Subodh", None) == "SUBODH"
    assert generate_pdf_password("Subodh", "") == "SUBODH"


def test_password_fallback_to_username():
    """Fallback to user_name when profile name is missing."""
    assert generate_pdf_password(None, user_name="subodh") == "SUBODH"


def test_password_missing_name_raises():
    """Missing both profile name and user_name raises ProtectedReportError."""
    with pytest.raises(ProtectedReportError, match="Patient profile name is required"):
        generate_pdf_password(None, None, user_name=None)

    with pytest.raises(ProtectedReportError, match="Patient profile name is required"):
        generate_pdf_password("   ", None, user_name="  ")


def test_encrypt_pdf_with_valid_password():
    """Test encrypt_pdf creates standard encrypted PDF unlockable with uppercase and lowercase name."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 750, "Sample Medical Lab Result: Hemoglobin 14.5 g/dL")
    c.save()
    raw_bytes = buf.getvalue()

    password = "SUBODH"
    encrypted_bytes = encrypt_pdf(raw_bytes, password)

    # 1. Verify file is encrypted via PyPDF2
    reader = PyPDF2.PdfReader(io.BytesIO(encrypted_bytes))
    assert reader.is_encrypted is True

    # 2. Verify incorrect password fails
    assert reader.decrypt("WRONGPASS") == 0

    # 3. Verify UPPERCASE succeeds
    assert reader.decrypt("SUBODH") in (1, 2)

    # 4. Verify lowercase succeeds
    reader_lower = PyPDF2.PdfReader(io.BytesIO(encrypted_bytes))
    assert reader_lower.decrypt("subodh") in (1, 2)

    # 5. Verify opening via pypdfium2 (Chrome/Edge PDF engine) fails without password
    with pytest.raises(Exception):
        pdfium.PdfDocument(encrypted_bytes)

    # 6. Verify opening via pypdfium2 succeeds with correct password
    doc = pdfium.PdfDocument(encrypted_bytes, password="SUBODH")
    assert len(doc) == 1
    text = doc[0].get_textpage().get_text_range()
    assert "Hemoglobin" in text
