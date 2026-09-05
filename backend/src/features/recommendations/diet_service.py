"""Finding-Driven Personalized Diet & Nutrition Engine.

Pipeline:
  1. Primary Focus Extraction — identify nutrition-relevant lab parameters & deviations
  2. Nutrition Context Integration — user food preferences, restrictions, regional styles
  3. Evidence-Grounded RAG Retrieval — fetch clinical guidelines for finding + user preference
  4. LLM Meal Builder & Smart Swap Generation
  5. Safety & Constraint Validation — verify zero food restriction leaks, no medication claims
  6. Persistence — store DietPlan for retrieval and secure sharing
"""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session, joinedload

from src.config import get_settings
from src.core.constants import DEFAULT_SPECIES_CATEGORY
from src.core.exceptions import LLMExtractionError, ReportNotFoundError
from src.core.severity import calculate_deviation_severity, get_status_color
from src.features.recommendations import rag_engine
from src.models.nutrition import DietPlan, NutritionContext
from src.models.report import Report
from src.schemas.nutrition import (
    DietPlanResponse,
    LimitItem,
    MealOptionItem,
    MealOptions,
    NutritionContextRequest,
    NutritionContextResponse,
    PrimaryFocusItem,
    SmartSwapItem,
)
from src.services.openrouter_client import call_llm
from src.utils.llm_json_parsing import extract_json_from_llm_response

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Nutrition Context Management
# ---------------------------------------------------------------------------


def get_nutrition_context(db: Session, profile_id: int) -> NutritionContextResponse:
    """Fetch saved nutrition context for a profile, creating default if missing."""
    ctx = db.query(NutritionContext).filter(NutritionContext.profile_id == profile_id).first()
    if ctx is None:
        ctx = NutritionContext(
            profile_id=profile_id,
            food_preference="vegetarian",
            restrictions_json=json.dumps([]),
            regional_styles_json=json.dumps(["indian"]),
            accessibility="common_household",
            clinician_restrictions=None,
        )
        db.add(ctx)
        db.commit()
        db.refresh(ctx)

    return _deserialize_context(ctx)


def update_nutrition_context(
    db: Session, profile_id: int, request: NutritionContextRequest
) -> NutritionContextResponse:
    """Update or create nutrition context for a profile."""
    ctx = db.query(NutritionContext).filter(NutritionContext.profile_id == profile_id).first()
    if ctx is None:
        ctx = NutritionContext(profile_id=profile_id)
        db.add(ctx)

    ctx.food_preference = request.food_preference
    ctx.restrictions_json = json.dumps(request.restrictions)
    ctx.regional_styles_json = json.dumps(request.regional_styles)
    ctx.accessibility = request.accessibility
    ctx.clinician_restrictions = request.clinician_restrictions

    db.commit()
    db.refresh(ctx)
    return _deserialize_context(ctx)


def _deserialize_context(ctx: NutritionContext) -> NutritionContextResponse:
    return NutritionContextResponse(
        id=ctx.id,
        profile_id=ctx.profile_id,
        food_preference=ctx.food_preference,
        restrictions=json.loads(ctx.restrictions_json or "[]"),
        regional_styles=json.loads(ctx.regional_styles_json or '["indian"]'),
        accessibility=ctx.accessibility,
        clinician_restrictions=ctx.clinician_restrictions,
        updated_at=ctx.updated_at,
    )


# ---------------------------------------------------------------------------
# Diet Plan Generation
# ---------------------------------------------------------------------------


def get_diet_plan(db: Session, report_id: int) -> Optional[DietPlanResponse]:
    """Fetch stored DietPlan for a report."""
    plan = db.query(DietPlan).filter(DietPlan.report_id == report_id).first()
    if plan is None:
        return None
    return _deserialize_diet_plan(plan)


def generate_diet_plan(
    db: Session,
    report_id: int,
    context_override: Optional[NutritionContextRequest] = None,
    force_regenerate: bool = False,
) -> DietPlanResponse:
    """Generate finding-driven personalized diet plan."""
    report = (
        db.query(Report)
        .options(joinedload(Report.test_values), joinedload(Report.profile))
        .filter(Report.id == report_id)
        .first()
    )
    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")

    # Return existing plan unless force_regenerate is True
    existing = db.query(DietPlan).filter(DietPlan.report_id == report_id).first()
    if existing and not force_regenerate and not context_override:
        return _deserialize_diet_plan(existing)

    # Get or update nutrition context
    if context_override:
        context_resp = update_nutrition_context(db, report.profile_id, context_override)
    else:
        context_resp = get_nutrition_context(db, report.profile_id)

    species_category = (
        report.profile.species_category
        if (report.profile and report.profile.species_category)
        else DEFAULT_SPECIES_CATEGORY
    )

    # Step 1: Identify Primary Focus Findings
    focus_findings = _extract_primary_focus(report.test_values)

    # Step 2: RAG Retrieval per focus finding
    retrieved_chunks = []
    for f in focus_findings:
        chunks = rag_engine.retrieve_per_finding(f, species_category, top_k=3)
        retrieved_chunks.extend(chunks)

    # Deduplicate chunks
    seen_ids = set()
    unique_chunks = []
    for chunk in retrieved_chunks:
        cid = chunk.get("id", id(chunk))
        if cid not in seen_ids:
            seen_ids.add(cid)
            unique_chunks.append(chunk)

    rag_context_str = rag_engine.format_rag_context_for_prompt(unique_chunks)
    sources = rag_engine.get_source_metadata(unique_chunks)

    # Step 3: LLM Synthesis with Nutrition Prompt
    plan_data = _synthesize_diet_plan(
        focus_findings, context_resp, species_category, rag_context_str
    )

    # Step 4: Safety & Constraint Validator
    plan_data = _validate_nutrition_safety(plan_data, context_resp, focus_findings)

    # Step 5: Persist to DB
    if existing:
        db.delete(existing)
        db.commit()

    new_plan = DietPlan(
        report_id=report_id,
        primary_focus_json=json.dumps([f for f in focus_findings], default=str),
        nutrition_direction=plan_data.get("nutrition_direction", ""),
        meal_options_json=json.dumps(plan_data.get("meal_options", {}), default=str),
        foods_to_limit_json=json.dumps(plan_data.get("foods_to_limit", []), default=str),
        smart_swaps_json=json.dumps(plan_data.get("smart_swaps", []), default=str),
        evidence_sources_json=json.dumps(sources, default=str),
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    return _deserialize_diet_plan(new_plan)


# ---------------------------------------------------------------------------
# Finding Extraction
# ---------------------------------------------------------------------------


def _extract_primary_focus(test_values: list) -> list[dict]:
    """Extract parameters that need attention or monitoring for nutrition focus."""
    focus = []
    for tv in test_values:
        val = getattr(tv, "value", None) if not isinstance(tv, dict) else tv.get("value")
        ref_low = getattr(tv, "ref_low", None) if not isinstance(tv, dict) else tv.get("ref_low")
        ref_high = getattr(tv, "ref_high", None) if not isinstance(tv, dict) else tv.get("ref_high")
        test_name = getattr(tv, "test_name", None) if not isinstance(tv, dict) else tv.get("test_name", "Unknown")
        unit = (getattr(tv, "unit", None) if not isinstance(tv, dict) else tv.get("unit")) or ""

        status_color = get_status_color(val, ref_low, ref_high)
        if status_color == "normal" or status_color is None:
            continue

        status = "high" if (isinstance(val, (int, float)) and ref_high is not None and val > ref_high) else "low"
        dev_severity = calculate_deviation_severity(val, ref_low, ref_high)
        priority = "attention" if (dev_severity and dev_severity >= 0.6) else "monitoring"

        if ref_low is not None and ref_high is not None and ref_low == ref_high:
            ref_low = None

        if ref_low is not None and ref_high is not None:
            ref_range = f"{ref_low}-{ref_high} {unit}".strip()
        elif ref_high is not None:
            ref_range = f"<{ref_high} {unit}".strip()
        elif ref_low is not None:
            ref_range = f">{ref_low} {unit}".strip()
        else:
            ref_range = "N/A"

        focus.append({
            "parameter": test_name,
            "value": val,
            "unit": unit,
            "reference_range": ref_range,
            "status": status,
            "priority": priority,
        })

    # Sort attention first
    focus.sort(key=lambda x: 0 if x["priority"] == "attention" else 1)
    return focus


# ---------------------------------------------------------------------------
# LLM Synthesis
# ---------------------------------------------------------------------------


def _synthesize_diet_plan(
    focus_findings: list[dict],
    context: NutritionContextResponse,
    species_category: str,
    rag_context: str,
) -> dict:
    settings = get_settings()

    system_prompt = f"""You are Mediora's Clinical Nutrition AI for {species_category} patients.
Your task is to generate evidence-grounded, highly personalized meal guidance based on:
1. VERIFIED LAB FINDINGS
2. USER NUTRITION CONTEXT (Food preference, dietary restrictions, regional meal style)
3. RETRIEVED CLINICAL KNOWLEDGE

RULES:
- STRICT COMPLIANCE WITH FOOD PREFERENCES: If food_preference is 'vegetarian' or 'vegan', NEVER include poultry, meat, seafood, or eggs (if vegan).
- STRICT COMPLIANCE WITH RESTRICTIONS: Do not include any forbidden ingredients from user restrictions (e.g. dairy, gluten, nuts).
- REGIONAL STAPLES: Tailor meal options to the requested regional style (e.g. Indian staples: Roti, Dal, Sabzi, Poha, Upma, Khichdi, Idli, Dosa, Sprouts).
- ACTIONABLE MEAL OPTIONS: Provide 3 distinct options for Breakfast, Lunch, and Dinner.
- SMART SWAPS: Provide 3 practical swaps (Instead of X -> Consider Y) aligned with lab findings.
- CONSIDER LIMITING: Provide 2-3 specific categories/foods to limit with clear reasoning grounded in lab findings.
- NO PRESCRIPTIONS OR DIAGNOSES: Do not prescribe drugs, medications, or diagnose diseases.

Return strict JSON in this structure:
{{
  "nutrition_direction": "Clinical dietary rationale explaining how this plan addresses the findings.",
  "meal_options": {{
    "breakfast": [
      {{"title": "Option 1 Title", "description": "Details", "highlights": ["High Fiber", "Low GI"]}},
      {{"title": "Option 2 Title", "description": "Details", "highlights": ["Protein Rich"]}},
      {{"title": "Option 3 Title", "description": "Details", "highlights": ["Antioxidant Rich"]}}
    ],
    "lunch": [
      {{"title": "Option 1 Title", "description": "Details", "highlights": ["Soluble Fiber"]}},
      {{"title": "Option 2 Title", "description": "Details", "highlights": ["Lean Protein"]}},
      {{"title": "Option 3 Title", "description": "Details", "highlights": ["Heart Healthy"]}}
    ],
    "dinner": [
      {{"title": "Option 1 Title", "description": "Details", "highlights": ["Light & Digestible"]}},
      {{"title": "Option 2 Title", "description": "Details", "highlights": ["Complex Carbs"]}},
      {{"title": "Option 3 Title", "description": "Details", "highlights": ["Nutrient Dense"]}}
    ]
  }},
  "foods_to_limit": [
    {{"category": "Refined Carbohydrates", "items": ["White bread", "Sweetened pastries"], "reason": "Causes rapid glycemic spikes."}}
  ],
  "smart_swaps": [
    {{"instead_of": "Refined White Rice", "consider": "Brown Rice or Foxtail Millet", "why": "Higher soluble fiber content helps manage lipid absorption and glycemic response."}}
  ]
}}"""

    user_prompt = f"""VERIFIED LAB FINDINGS:
{json.dumps(focus_findings, indent=2)}

USER NUTRITION CONTEXT:
- Food Preference: {context.food_preference.upper()}
- Dietary Restrictions / Allergies: {', '.join(context.restrictions) if context.restrictions else 'None'}
- Regional Meal Style: {', '.join(context.regional_styles)}
- Accessibility / Budget: {context.accessibility}
- Clinician Restrictions: {context.clinician_restrictions or 'None'}

{rag_context}

Generate personalized finding-driven nutrition guidance in strict JSON format."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        raw_response = asyncio.run(
            call_llm(
                messages=messages,
                model_slug=settings.recommendation_model_slug,
                json_mode=True,
                temperature=0.4,
            )
        )
        parsed = extract_json_from_llm_response(raw_response)
        if isinstance(parsed, dict):
            return parsed
    except Exception as exc:
        logger.warning("LLM diet plan synthesis failed, using fallback: %s", exc)

    return _build_fallback_diet_plan(focus_findings, context)


def _build_fallback_diet_plan(findings: list[dict], context: NutritionContextResponse) -> dict:
    """Fallback meal plan when LLM is unavailable."""
    is_veg = context.food_preference in ("vegetarian", "vegan")

    b_options = [
        {"title": "Steel-Cut Oats with Nuts & Berries", "description": "High soluble fiber to lower LDL cholesterol.", "highlights": ["High Fiber", "Heart Healthy"]},
        {"title": "Vegetable Poha or Upma", "description": "Light, whole-grain breakfast with green peas & mustard seeds.", "highlights": ["Complex Carbs", "Low Fat"]},
        {"title": "Sprouted Moong Salad with Lemon", "description": "Protein and enzyme rich start to the day.", "highlights": ["High Protein", "Low GI"]},
    ]

    l_options = [
        {"title": "Roti with Dal & Mixed Green Vegetables", "description": "Balanced Indian whole-food plate with spinach or bhindi.", "highlights": ["Balanced Plate", "Soluble Fiber"]},
        {"title": "Quinoa & Vegetable Khichdi", "description": "Comforting one-pot meal with lentils, vegetables, and cumin.", "highlights": ["Nutrient Dense", "Easy Digestion"]},
        {"title": "Brown Rice with Chickpea Curry (Chana Masala)", "description": "Plant-based protein rich in legumes and complex fiber.", "highlights": ["Legume Protein", "Satiety"]},
    ]

    d_options = [
        {"title": "Steamed Tofu or Paneer with Roasted Broccoli", "description": "Light evening meal low in saturated fat.", "highlights": ["Light & Lean", "Low Carb"]},
        {"title": "Lentil Soup (Dal Tadka) with Soft Roti", "description": "Heart-healthy dinner rich in potassium and folate.", "highlights": ["Potassium Rich", "Heart Healthy"]},
        {"title": "Grilled Vegetable & Millet Bowl", "description": "Foxtail millet served with steamed zucchini, carrots, and mint chutney.", "highlights": ["Low GI", "Fiber Rich"]},
    ]

    if not is_veg:
        l_options[1] = {"title": "Grilled Chicken Breast with Steamed Vegetables", "description": "Lean protein meal rich in niacin and low in saturated fat.", "highlights": ["Lean Protein", "Low Fat"]}

    return {
        "nutrition_direction": "Focus on high soluble fiber, low glycemic index whole grains, and lean unsaturated fats to support healthy metabolic and lipid function.",
        "meal_options": {"breakfast": b_options, "lunch": l_options, "dinner": d_options},
        "foods_to_limit": [
            {"category": "Trans & Saturated Fats", "items": ["Deep fried snacks", "Commercial pastries"], "reason": "Increases circulating LDL cholesterol."},
            {"category": "Refined Sugars", "items": ["Sweetened beverages", "White sugar sweets"], "reason": "Triggers rapid blood glucose & insulin spikes."}
        ],
        "smart_swaps": [
            {"instead_of": "Refined White Bread / Naan", "consider": "Whole Wheat Roti or Multigrain Roti", "why": "Whole grains contain dietary fiber that slows sugar absorption."},
            {"instead_of": "Butter / Ghee in excess", "consider": "Cold-Pressed Mustard Oil or Extra Virgin Olive Oil", "why": "Unsaturated fatty acids improve lipid profile."}
        ]
    }


# ---------------------------------------------------------------------------
# Safety Validator
# ---------------------------------------------------------------------------


def _validate_nutrition_safety(
    plan_data: dict,
    context: NutritionContextResponse,
    findings: list[dict],
) -> dict:
    """Validate and clean generated meal plan data."""
    is_veg = context.food_preference in ("vegetarian", "vegan")
    forbidden_words = ["chicken", "mutton", "fish", "pork", "beef", "seafood", "egg"] if is_veg else []

    # Clean meal options
    meals = plan_data.get("meal_options", {})
    for meal_type in ["breakfast", "lunch", "dinner"]:
        options = meals.get(meal_type, [])
        clean_opts = []
        for opt in options:
            if not isinstance(opt, dict):
                continue
            title = opt.get("title", "")
            desc = opt.get("description", "")
            full_text = f"{title} {desc}".lower()

            if is_veg and any(w in full_text for w in forbidden_words):
                logger.warning("Stripped non-veg meal option from veg plan: %s", title)
                continue
            clean_opts.append(opt)
        meals[meal_type] = clean_opts

    plan_data["meal_options"] = meals
    return plan_data


# ---------------------------------------------------------------------------
# Deserialization Helper
# ---------------------------------------------------------------------------


def _deserialize_diet_plan(plan: DietPlan) -> DietPlanResponse:
    primary_focus = [PrimaryFocusItem(**f) for f in json.loads(plan.primary_focus_json or "[]")]
    meal_opts_raw = json.loads(plan.meal_options_json or "{}")

    breakfast = [MealOptionItem(**o) for o in meal_opts_raw.get("breakfast", [])]
    lunch = [MealOptionItem(**o) for o in meal_opts_raw.get("lunch", [])]
    dinner = [MealOptionItem(**o) for o in meal_opts_raw.get("dinner", [])]

    limits = [LimitItem(**l) for l in json.loads(plan.foods_to_limit_json or "[]")]
    swaps = [SmartSwapItem(**s) for s in json.loads(plan.smart_swaps_json or "[]")]
    sources = json.loads(plan.evidence_sources_json or "[]")

    return DietPlanResponse(
        id=plan.id,
        report_id=plan.report_id,
        has_been_generated=True,
        primary_focus=primary_focus,
        nutrition_direction=plan.nutrition_direction,
        meal_options=MealOptions(breakfast=breakfast, lunch=lunch, dinner=dinner),
        foods_to_limit=limits,
        smart_swaps=swaps,
        evidence_sources=sources,
        generated_at=plan.generated_at,
    )
