from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Date, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.constants import REPORT_STATUS_PROCESSING
from src.database import Base

if TYPE_CHECKING:
    from src.models.profile import Profile
    from src.models.recommendation import Recommendation


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), nullable=False)
    report_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    original_file_path: Mapped[str] = mapped_column(String, nullable=False)
    preprocessed_file_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ocr_raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default=REPORT_STATUS_PROCESSING)
    report_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(server_default=func.now())
    health_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=None)

    profile: Mapped["Profile"] = relationship(back_populates="reports")
    test_values: Mapped[List["ReportTestValue"]] = relationship(
        back_populates="report",
        cascade="all, delete-orphan",
    )
    recommendations: Mapped[List["Recommendation"]] = relationship(
        back_populates="report",
        cascade="all, delete-orphan",
    )


class ReportTestValue(Base):
    __tablename__ = "report_test_values"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), nullable=False)
    test_name: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ref_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ref_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_manually_corrected: Mapped[bool] = mapped_column(Boolean, default=False)

    report: Mapped["Report"] = relationship(back_populates="test_values")
