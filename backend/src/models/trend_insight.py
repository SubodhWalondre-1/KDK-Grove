from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class TrendInsight(Base):
    __tablename__ = "trend_insights"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), nullable=False)
    test_name: Mapped[str] = mapped_column(String, nullable=False)
    insight_text: Mapped[str] = mapped_column(String, nullable=False)
    based_on_report_count: Mapped[int] = mapped_column(Integer, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (UniqueConstraint("profile_id", "test_name"),)
