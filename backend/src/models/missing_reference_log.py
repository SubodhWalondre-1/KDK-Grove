from datetime import datetime

from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class MissingReferenceLog(Base):
    __tablename__ = "missing_reference_log"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    species: Mapped[str] = mapped_column(String, nullable=False)
    test_name: Mapped[str] = mapped_column(String, nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(server_default=func.now())
