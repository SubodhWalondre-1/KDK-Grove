from typing import Literal

from pydantic import BaseModel, ConfigDict


class TranslationItem(BaseModel):
    source_type: Literal["test_name", "status_label"]
    source_key: str


class BulkTranslationRequest(BaseModel):
    items: list[TranslationItem]
    language_code: str


class TranslatedItem(BaseModel):
    source_type: str
    source_key: str
    translated_text: str
    method: str

    model_config = ConfigDict(from_attributes=True)


class BulkTranslationResponse(BaseModel):
    language_code: str
    translations: list[TranslatedItem]


class LanguageOption(BaseModel):
    code: str
    name: str


class LanguagesResponse(BaseModel):
    languages: list[LanguageOption]


class GlossaryEntryCreate(BaseModel):
    term_en: str
    language_code: str
    translated_term: str
