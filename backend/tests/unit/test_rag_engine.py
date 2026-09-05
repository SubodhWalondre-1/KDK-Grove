import pytest
from src.features.recommendations.rag_engine import retrieve_rag_context, format_rag_context_for_prompt, load_rag_dataset


def test_rag_dataset_loads_successfully():
    dataset = load_rag_dataset()
    assert isinstance(dataset, list)
    assert len(dataset) >= 15


def test_rag_retrieval_for_diabetes_parameters():
    test_values = [
        {"test_name": "Blood Glucose", "value": 145.0, "ref_low": 70.0, "ref_high": 100.0, "status": "red"},
    ]
    chunks = retrieve_rag_context(test_values, species_category="human", top_k=3)
    assert len(chunks) == 3
    titles = [c["title"] for c in chunks]
    assert any("Diabetes" in t for t in titles)


def test_rag_retrieval_for_ckd_parameters():
    test_values = [
        {"test_name": "Serum Creatinine", "value": 2.4, "ref_low": 0.5, "ref_high": 1.2, "status": "red"},
    ]
    chunks = retrieve_rag_context(test_values, species_category="human", top_k=3)
    assert len(chunks) == 3
    titles = [c["title"] for c in chunks]
    assert any("Kidney" in t or "CKD" in t for t in titles)


def test_rag_context_formatting():
    chunks = [
        {"title": "Test Guideline", "category": "diet", "content": "Eat healthy vegetables."}
    ]
    formatted = format_rag_context_for_prompt(chunks)
    assert "EVIDENCE-BASED CLINICAL REFERENCE KNOWLEDGE" in formatted
    assert "Test Guideline" in formatted
    assert "Eat healthy vegetables." in formatted
