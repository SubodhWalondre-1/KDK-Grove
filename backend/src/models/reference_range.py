from typing import Optional

from sqlalchemy import Float, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class ReferenceRange(Base):
    __tablename__ = "reference_ranges"
    __table_args__ = (
        Index("ix_reference_ranges_species_test", "species", "test_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    species: Mapped[str] = mapped_column(String, nullable=False)
    test_name: Mapped[str] = mapped_column(String, nullable=False)
    gender: Mapped[str] = mapped_column(String, default="any")
    unit: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    range_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    range_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
