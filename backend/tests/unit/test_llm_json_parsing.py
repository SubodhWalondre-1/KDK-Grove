import pytest

from src.utils.llm_json_parsing import extract_json_from_llm_response


def test_parses_clean_json_object():
    raw = '{"a": 1, "b": "test"}'
    result = extract_json_from_llm_response(raw)
    assert result == {"a": 1, "b": "test"}


def test_parses_clean_json_array():
    raw = '[1, 2, 3]'
    result = extract_json_from_llm_response(raw)
    assert result == [1, 2, 3]


def test_parses_json_with_markdown_fence():
    raw = "```json\n{\n  \"diet\": [\"Eat greens\"]\n}\n```"
    result = extract_json_from_llm_response(raw)
    assert result == {"diet": ["Eat greens"]}


def test_parses_json_with_surrounding_prose():
    raw = "Here is the requested output:\n{\"diet\": [\"Drink water\"]}\nHope this helps!"
    result = extract_json_from_llm_response(raw)
    assert result == {"diet": ["Drink water"]}


def test_raises_value_error_on_garbage():
    raw = "Sorry, I cannot assist with this request because no data was found."
    with pytest.raises(ValueError) as exc_info:
        extract_json_from_llm_response(raw)
    assert "Could not parse JSON" in str(exc_info.value)
