"""Unit tests for llm_extraction.py — §15 test #1:
'Qwen3 output with extra text around the JSON block still parses correctly.'
"""

import json
from unittest.mock import AsyncMock, patch

import pytest

from src.core.exceptions import LLMExtractionError
from src.features.report_extraction.llm_extraction import extract_structured_data

VALID_TEST_VALUES = [
    {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5},
    {"test_name": "Blood Sugar", "value": 95.0, "unit": "mg/dL", "ref_low": 70.0, "ref_high": 100.0},
]

MODULE_PATH = "src.features.report_extraction.llm_extraction.call_llm"


@pytest.mark.asyncio
async def test_extract_clean_json():
    mock_response = json.dumps(VALID_TEST_VALUES)
    with patch(MODULE_PATH, new_callable=AsyncMock, return_value=mock_response):
        result = await extract_structured_data("some ocr text")

    assert len(result) == 2
    assert result[0]["test_name"] == "Hemoglobin"
    assert result[0]["value"] == 14.5
    assert result[1]["test_name"] == "Blood Sugar"


@pytest.mark.asyncio
async def test_extract_json_with_markdown_fence():
    mock_response = "```json\n" + json.dumps(VALID_TEST_VALUES) + "\n```"
    with patch(MODULE_PATH, new_callable=AsyncMock, return_value=mock_response):
        result = await extract_structured_data("some ocr text")

    assert len(result) == 2
    assert result[0]["test_name"] == "Hemoglobin"
    assert result[1]["value"] == 95.0


@pytest.mark.asyncio
async def test_extract_json_with_surrounding_prose():
    mock_response = (
        "Here is the extracted data:\n"
        + json.dumps(VALID_TEST_VALUES)
        + "\nLet me know if you need anything else!"
    )
    with patch(MODULE_PATH, new_callable=AsyncMock, return_value=mock_response):
        result = await extract_structured_data("some ocr text")

    assert len(result) == 2
    assert result[0]["test_name"] == "Hemoglobin"


@pytest.mark.asyncio
async def test_extract_invalid_json_raises():
    mock_response = "This is not JSON at all, just garbage text with no brackets"
    with patch(MODULE_PATH, new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(LLMExtractionError):
            await extract_structured_data("some ocr text")


@pytest.mark.asyncio
async def test_extract_missing_test_name_raises():
    bad_values = [
        {"value": 14.5, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5},
        {"value": 95.0, "unit": "mg/dL"},
    ]
    mock_response = json.dumps(bad_values)
    with patch(MODULE_PATH, new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(LLMExtractionError, match="no valid test values"):
            await extract_structured_data("some ocr text")
