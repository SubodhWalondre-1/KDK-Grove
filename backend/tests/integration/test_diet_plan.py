"""Integration tests for finding-driven Personalized Diet Plan Engine."""

import json
from unittest.mock import AsyncMock, patch
import pytest

from src.models.nutrition import DietPlan, NutritionContext
from tests.fixtures.seed_data import (
    create_completed_report,
    create_test_profile,
    create_test_reference_ranges,
)

LLM_MOCK_PATH = "src.features.recommendations.diet_service.call_llm"


@pytest.fixture()
def setup_user_and_report(db_session, client):
    resp = client.post(
        "/api/auth/signup",
        json={"name": "Diet User", "email": "dietuser@mediora.dev", "password": "password123"},
    )
    user_id = resp.json()["user"]["id"]
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_test_reference_ranges(db_session)
    profile = create_test_profile(db_session, user_id, species="human")

    return db_session, user_id, profile, headers


def test_get_and_update_nutrition_context(client, setup_user_and_report):
    """Verify getting and saving user nutrition context."""
    db, _, profile, headers = setup_user_and_report

    # GET default context
    get_resp = client.get(f"/api/profiles/{profile.id}/nutrition-context", headers=headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["profile_id"] == profile.id
    assert "food_preference" in data

    # POST update context
    update_payload = {
        "food_preference": "vegetarian",
        "restrictions": ["dairy", "gluten"],
        "regional_styles": ["indian", "south_indian"],
        "accessibility": "common_household",
        "clinician_restrictions": "Strict low sodium < 1500mg",
    }
    post_resp = client.post(
        f"/api/profiles/{profile.id}/nutrition-context",
        json=update_payload,
        headers=headers,
    )
    assert post_resp.status_code == 200
    updated = post_resp.json()
    assert updated["food_preference"] == "vegetarian"
    assert updated["restrictions"] == ["dairy", "gluten"]
    assert updated["regional_styles"] == ["indian", "south_indian"]
    assert updated["clinician_restrictions"] == "Strict low sodium < 1500mg"


def test_generate_finding_driven_diet_plan(client, setup_user_and_report):
    """Verify generating finding-driven diet plan anchored to lab report findings."""
    db, _, profile, headers = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [
            {"test_name": "Total Cholesterol", "value": 240.0, "ref_low": 0.0, "ref_high": 200.0},
            {"test_name": "Blood Sugar", "value": 140.0, "ref_low": 70.0, "ref_high": 100.0},
        ],
    )

    context_payload = {
        "food_preference": "vegetarian",
        "restrictions": [],
        "regional_styles": ["indian", "south_indian"],
        "accessibility": "common_household",
        "clinician_restrictions": None,
    }

    mock_llm_json = {
        "nutrition_direction": "Focus on high soluble fiber legumes and low glycemic grains to manage lipids and blood sugar.",
        "meal_options": {
            "breakfast": [
                {"title": "Oats Upma with Vegetables", "description": "High soluble fiber.", "highlights": ["High Fiber"]}
            ],
            "lunch": [
                {"title": "Brown Rice with Dal", "description": "Balanced legumes.", "highlights": ["Low GI"]}
            ],
            "dinner": [
                {"title": "Quinoa & Moong Khichdi", "description": "Light evening meal.", "highlights": ["Nutrient Dense"]}
            ]
        },
        "foods_to_limit": [
            {"category": "Saturated Fats", "items": ["Deep fried snacks"], "reason": "Raises LDL cholesterol."}
        ],
        "smart_swaps": [
            {"instead_of": "White Rice", "consider": "Brown Rice or Millets", "why": "Reduces glycemic load."}
        ]
    }

    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = json.dumps(mock_llm_json)
        resp = client.post(
            f"/api/reports/{report.id}/diet-plan/generate",
            json=context_payload,
            headers=headers,
        )

    assert resp.status_code == 200
    plan_data = resp.json()

    assert plan_data["report_id"] == report.id
    assert plan_data["has_been_generated"] is True
    assert len(plan_data["primary_focus"]) >= 1

    # Check focus findings
    focus_params = [f["parameter"] for f in plan_data["primary_focus"]]
    assert "Total Cholesterol" in focus_params or "Blood Sugar" in focus_params

    # Check meal options structure
    assert "breakfast" in plan_data["meal_options"]
    assert "lunch" in plan_data["meal_options"]
    assert "dinner" in plan_data["meal_options"]

    # Check smart swaps and foods to limit
    assert len(plan_data["smart_swaps"]) >= 1
    assert len(plan_data["foods_to_limit"]) >= 1


def test_safety_validator_strips_forbidden_meat_for_vegetarian(client, setup_user_and_report):
    """Verify safety validator strips non-vegetarian options if user context is vegetarian."""
    db, _, profile, headers = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Total Cholesterol", "value": 240.0, "ref_low": 0.0, "ref_high": 200.0}],
    )

    context_payload = {
        "food_preference": "vegetarian",
        "restrictions": [],
        "regional_styles": ["indian"],
        "accessibility": "common_household",
        "clinician_restrictions": None,
    }

    # Mock LLM returning chicken option by mistake
    mock_llm_json = {
        "nutrition_direction": "Balanced diet.",
        "meal_options": {
            "breakfast": [
                {"title": "Oats Upma", "description": "Healthy oats.", "highlights": ["Fiber"]}
            ],
            "lunch": [
                {"title": "Grilled Chicken Salad", "description": "Lean chicken breast.", "highlights": ["Protein"]},
                {"title": "Paneer Roti", "description": "Cottage cheese with roti.", "highlights": ["Protein"]}
            ],
            "dinner": [
                {"title": "Dal Khichdi", "description": "Lentil khichdi.", "highlights": ["Light"]}
            ]
        },
        "foods_to_limit": [],
        "smart_swaps": []
    }

    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = json.dumps(mock_llm_json)
        resp = client.post(
            f"/api/reports/{report.id}/diet-plan/generate",
            json=context_payload,
            headers=headers,
        )

    assert resp.status_code == 200
    plan_data = resp.json()

    lunch_options = plan_data["meal_options"]["lunch"]
    titles = [o["title"] for o in lunch_options]
    assert "Grilled Chicken Salad" not in titles
    assert "Paneer Roti" in titles
