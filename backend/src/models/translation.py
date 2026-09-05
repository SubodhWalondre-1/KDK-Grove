from datetime import datetime

from sqlalchemy import String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class MedicalTermsGlossary(Base):
    __tablename__ = "medical_terms_glossary"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    term_en: Mapped[str] = mapped_column(String, nullable=False)
    language_code: Mapped[str] = mapped_column(String, nullable=False)
    translated_term: Mapped[str] = mapped_column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("term_en", "language_code", name="uq_glossary_term_lang"),
    )


class Translation(Base):
    __tablename__ = "translations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    source_key: Mapped[str] = mapped_column(String, nullable=False)
    language_code: Mapped[str] = mapped_column(String, nullable=False)
    translated_text: Mapped[str] = mapped_column(String, nullable=False)
    method: Mapped[str] = mapped_column(String, default="glossary", nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        UniqueConstraint("source_type", "source_key", language_code, name="uq_translation_type_key_lang"),
    )
