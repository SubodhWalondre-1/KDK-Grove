from pydantic import BaseModel, ConfigDict


class ExplanationResponse(BaseModel):
    report_id: int
    value_id: int
    canonical_test_name: str
    explanation_text: str

    model_config = ConfigDict(from_attributes=True)
