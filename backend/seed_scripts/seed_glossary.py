"""Seed script for Hindi medical terms glossary and status label translations.

Idempotent: safe to run multiple times without creating duplicate rows.
"""

import sys
from pathlib import Path

# Add backend directory to python path for direct execution
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.database import SessionLocal, Base, engine
import src.models.translation  # noqa: F401
from src.models.translation import MedicalTermsGlossary, Translation

GLOSSARY_HINDI_ENTRIES = [
    ("Hemoglobin", "हीमोग्लोबिन"),
    ("Blood Sugar", "रक्त शर्करा"),
    ("Fasting Blood Sugar", "खाली पेट रक्त शर्करा"),
    ("Random Blood Sugar", "रैंडम रक्त शर्करा"),
    ("Cholesterol", "कोलेस्ट्रॉल"),
    ("HDL Cholesterol", "एचडीएल कोलेस्ट्रॉल"),
    ("LDL Cholesterol", "एलडीएल कोलेस्ट्रॉल"),
    ("Triglycerides", "ट्राइग्लीसराइड्स"),
    ("Creatinine", "क्रिएटिनिन"),
    ("Blood Urea Nitrogen", "ब्लड यूरिया नाइट्रोजन"),
    ("BUN", "बीयूएन"),
    ("ALT", "एएलटी (एसजीपीटी)"),
    ("AST", "एएसटी (एसजीओटी)"),
    ("SGPT", "एसजीपीटी"),
    ("SGOT", "एसजीओटी"),
    ("Total Protein", "कुल प्रोटीन"),
    ("Albumin", "एल्ब्यूमिन"),
    ("Globulin", "ग्लोबुलिन"),
    ("White Blood Cell Count", "श्वेत रक्त कोशिका संख्या"),
    ("WBC", "डब्ल्यूबीसी"),
    ("Red Blood Cell Count", "लाल रक्त कोशिका संख्या"),
    ("RBC", "आरबीसी"),
    ("Platelet Count", "प्लेटलेट संख्या"),
    ("Sodium", "सोडियम"),
    ("Potassium", "पोटेशियम"),
    ("Calcium", "कैल्शियम"),
    ("Chloride", "क्लोराइड"),
    ("Bicarbonate", "बाइकार्बोनेट"),
    ("Vitamin D", "विटामिन डी"),
    ("Vitamin B12", "विटामिन बी12"),
    ("Thyroid Stimulating Hormone", "थायराइड उत्तेजक हार्मोन"),
    ("TSH", "टीएसएच"),
    ("Free T3", "फ्री टी3"),
    ("Free T4", "फ्री टी4"),
    ("HbA1c", "एचबीए1सी (ग्लिकेटेड हीमोग्लोबिन)"),
    ("Bilirubin Total", "कुल बिलीरुबिन"),
    ("Bilirubin Direct", "डायरेक्ट बिलीरुबिन"),
    ("Alkaline Phosphatase", "अल्कलाइन फॉस्फेट"),
    ("Uric Acid", "यूरिक एसिड"),
    ("ESR", "ईएसआर (एरिथ्रोसाइट अवसादन दर)"),
]

STATUS_LABEL_ENTRIES = [
    ("status_label", "Normal", "hi-IN", "सामान्य", "glossary"),
    ("status_label", "Borderline", "hi-IN", "सीमा रेखा", "glossary"),
    ("status_label", "Abnormal", "hi-IN", "असामान्य", "glossary"),
]


def seed_glossary():
    """Seed Hindi medical term glossary entries and status label cache entries idempotently."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        glossary_added = 0
        for term_en, term_hi in GLOSSARY_HINDI_ENTRIES:
            existing = (
                db.query(MedicalTermsGlossary)
                .filter(
                    MedicalTermsGlossary.term_en == term_en,
                    MedicalTermsGlossary.language_code == "hi-IN",
                )
                .first()
            )
            if not existing:
                db.add(
                    MedicalTermsGlossary(
                        term_en=term_en,
                        language_code="hi-IN",
                        translated_term=term_hi,
                    )
                )
                glossary_added += 1
            else:
                existing.translated_term = term_hi

        status_added = 0
        for src_type, src_key, lang, trans_text, method in STATUS_LABEL_ENTRIES:
            existing = (
                db.query(Translation)
                .filter(
                    Translation.source_type == src_type,
                    Translation.source_key == src_key,
                    Translation.language_code == lang,
                )
                .first()
            )
            if not existing:
                db.add(
                    Translation(
                        source_type=src_type,
                        source_key=src_key,
                        language_code=lang,
                        translated_text=trans_text,
                        method=method,
                    )
                )
                status_added += 1
            else:
                existing.translated_text = trans_text

        db.commit()
        print(f"Glossary seeding complete: {glossary_added} medical terms, {status_added} status labels added/updated.")

    except Exception as exc:
        db.rollback()
        print(f"Error seeding glossary: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_glossary()
