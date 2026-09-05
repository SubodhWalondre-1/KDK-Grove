from typing import Optional

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class TestNameAlias(Base):
    __tablename__ = "test_name_aliases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    alias_text: Mapped[str] = mapped_column(String, nullable=False)
    canonical_test_name: Mapped[str] = mapped_column(String, nullable=False)
    species_category: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("alias_text", "species_category", name="uq_test_alias_species"),
    )
