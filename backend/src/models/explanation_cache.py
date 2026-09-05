from datetime import datetime

from sqlalchemy import String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class ExplanationCache(Base):
    __tablename__ = "explanation_cache"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    canonical_test_name: Mapped[str] = mapped_column(String, nullable=False)
    severity_bucket: Mapped[str] = mapped_column(String, nullable=False)
    species_category: Mapped[str] = mapped_column(String, nullable=False)
    explanation_text: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        UniqueConstraint(
            "canonical_test_name",
            "severity_bucket",
            "species_category",
            name="uq_explanation_cache_key",
        ),
    )
