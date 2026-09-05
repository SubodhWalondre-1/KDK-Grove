from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.constants import SHARE_LINK_STATUS_ACTIVE
from src.database import Base


class ShareLink(Base):
    __tablename__ = "share_links"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    token: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String, default=SHARE_LINK_STATUS_ACTIVE, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0)

    access_logs: Mapped[List["AccessLog"]] = relationship(
        back_populates="share_link",
        cascade="all, delete-orphan",
    )


class AccessLog(Base):
    __tablename__ = "access_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    share_link_id: Mapped[int] = mapped_column(ForeignKey("share_links.id"), nullable=False)
    accessed_at: Mapped[datetime] = mapped_column(server_default=func.now())
    ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    device_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    viewer_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    seen: Mapped[bool] = mapped_column(Boolean, default=False)

    share_link: Mapped["ShareLink"] = relationship(back_populates="access_logs")
