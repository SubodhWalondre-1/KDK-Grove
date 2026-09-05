import logging
from typing import List, Optional

import numpy as np
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.core.constants import (
    HEALTH_SCORE_TREND_STABLE_THRESHOLD,
    REPORT_STATUS_COMPLETED,
    STATUS_RED,
    TREND_DIRECTION_DECREASING,
    TREND_DIRECTION_INCREASING,
    TREND_DIRECTION_INSUFFICIENT_DATA,
    TREND_DIRECTION_REFERENCE_UNAVAILABLE,
    TREND_DIRECTION_STABLE,
    TREND_MIN_REPORTS_FOR_TREND,
    TREND_SPARKLINE_MAX_POINTS,
    TREND_STABLE_THRESHOLD,
)
from src.core.severity import calculate_health_score, get_status_color
from src.models.report import Report, ReportTestValue
from src.models.trend_insight import TrendInsight
from src.schemas.trend import (
    HealthScoreTrendSummary,
    TestTrendSeriesResponse,
    TrendInsightResponse,
    TrendListItem,
    TrendListResponse,
    TrendOverviewItem,
    TrendOverviewResponse,
    TrendPoint,
)

logger = logging.getLogger(__name__)


def calculate_trend(values_over_time: list) -> dict:
    """Compute slope and direction across 2+ report data points using linear regression."""
    if len(values_over_time) < TREND_MIN_REPORTS_FOR_TREND:
        return {
            "direction": TREND_DIRECTION_INSUFFICIENT_DATA,
            "slope": None,
            "normalized_slope": None,
        }

    x = np.arange(len(values_over_time))
    y = np.array([v.value if hasattr(v, "value") else v["value"] for v in values_over_time], dtype=float)
    slope, _ = np.polyfit(x, y, 1)

    latest = values_over_time[-1]
    latest_ref_low = latest.ref_low if hasattr(latest, "ref_low") else latest.get("ref_low")
    latest_ref_high = latest.ref_high if hasattr(latest, "ref_high") else latest.get("ref_high")

    if latest_ref_low is None or latest_ref_high is None:
        return {
            "direction": TREND_DIRECTION_REFERENCE_UNAVAILABLE,
            "slope": float(slope),
            "normalized_slope": None,
        }

    ref_width = latest_ref_high - latest_ref_low
    if ref_width <= 0:
        return {
            "direction": TREND_DIRECTION_REFERENCE_UNAVAILABLE,
            "slope": float(slope),
            "normalized_slope": None,
        }

    normalized_slope = slope / ref_width
    if abs(normalized_slope) < TREND_STABLE_THRESHOLD:
        direction = TREND_DIRECTION_STABLE
    elif normalized_slope > 0:
        direction = TREND_DIRECTION_INCREASING
    else:
        direction = TREND_DIRECTION_DECREASING

    return {
        "direction": direction,
        "slope": float(slope),
        "normalized_slope": float(normalized_slope),
    }


def calculate_health_score_trend(scores_over_time: list[Optional[float]]) -> dict:
    """Compute direction and slope for 0–100 health score progression over time."""
    valid_scores = [s for s in scores_over_time if s is not None]
    if len(valid_scores) < TREND_MIN_REPORTS_FOR_TREND:
        return {
            "direction": TREND_DIRECTION_INSUFFICIENT_DATA,
            "slope": None,
            "normalized_slope": None,
        }

    x = np.arange(len(valid_scores))
    y = np.array(valid_scores, dtype=float)
    slope, _ = np.polyfit(x, y, 1)

    if abs(slope) < HEALTH_SCORE_TREND_STABLE_THRESHOLD:
        direction = TREND_DIRECTION_STABLE
    elif slope > 0:
        direction = TREND_DIRECTION_INCREASING
    else:
        direction = TREND_DIRECTION_DECREASING

    return {
        "direction": direction,
        "slope": float(slope),
        "normalized_slope": float(slope),
    }


def get_trend_list(db: Session, profile_id: int) -> TrendListResponse:
    """Return all distinct test names present in completed reports for a profile with report counts."""
    results = (
        db.query(
            ReportTestValue.test_name,
            func.count(ReportTestValue.id).label("report_count"),
        )
        .join(Report, ReportTestValue.report_id == Report.id)
        .filter(Report.profile_id == profile_id, Report.status == REPORT_STATUS_COMPLETED)
        .group_by(ReportTestValue.test_name)
        .all()
    )

    items = [
        TrendListItem(test_name=row[0], report_count=row[1])
        for row in results
    ]
    return TrendListResponse(profile_id=profile_id, tests=items)


def get_test_trend_series(db: Session, profile_id: int, test_name: str) -> TestTrendSeriesResponse:
    """Return the chronological series of data points and trend calculation for a test parameter."""
    series_rows = _fetch_test_value_series(db, profile_id, test_name)

    if not series_rows:
        return TestTrendSeriesResponse(
            profile_id=profile_id,
            test_name=test_name,
            unit=None,
            points=[],
            direction=TREND_DIRECTION_INSUFFICIENT_DATA,
            normalized_slope=None,
            based_on_report_count=0,
        )

    points = []
    for tv, report in series_rows:
        status = get_status_color(tv.value, tv.ref_low, tv.ref_high)
        points.append(
            TrendPoint(
                report_id=report.id,
                report_date=report.report_date,
                value=tv.value,
                unit=tv.unit,
                ref_low=tv.ref_low,
                ref_high=tv.ref_high,
                status=status,
            )
        )

    test_value_objs = [tv for tv, _ in series_rows]
    trend_res = calculate_trend(test_value_objs)
    latest_unit = test_value_objs[-1].unit if test_value_objs else None

    return TestTrendSeriesResponse(
        profile_id=profile_id,
        test_name=test_name,
        unit=latest_unit,
        points=points,
        direction=trend_res["direction"],
        normalized_slope=trend_res["normalized_slope"],
        based_on_report_count=len(points),
    )


def get_trend_overview(db: Session, profile_id: int) -> TrendOverviewResponse:
    """Return summary sparklines and trend directions for all parameters and overall health score."""
    completed_reports = (
        db.query(Report)
        .filter(Report.profile_id == profile_id, Report.status == REPORT_STATUS_COMPLETED)
        .order_by(Report.report_date.asc().nulls_last(), Report.uploaded_at.asc())
        .all()
    )

    scores_over_time = []
    for r in completed_reports:
        hs = r.health_score
        if (hs is None or hs == 0.0) and r.test_values:
            computed = calculate_health_score(r.test_values)
            if computed is not None and computed > 0:
                hs = computed
                r.health_score = computed
        scores_over_time.append(hs)

    hs_trend_res = calculate_health_score_trend(scores_over_time)

    sparkline_scores = (
        scores_over_time[-TREND_SPARKLINE_MAX_POINTS:]
        if scores_over_time
        else []
    )
    valid_scores = [s for s in scores_over_time if s is not None and s > 0]
    valid_scores_count = len(valid_scores)
    latest_score_val = valid_scores[-1] if valid_scores else (scores_over_time[-1] if scores_over_time else None)

    hs_summary = HealthScoreTrendSummary(
        sparkline=sparkline_scores,
        direction=hs_trend_res["direction"],
        latest_score=latest_score_val,
        based_on_report_count=valid_scores_count,
    )

    trend_list = get_trend_list(db, profile_id)
    overview_items = []

    for test_item in trend_list.tests:
        series_rows = _fetch_test_value_series(db, profile_id, test_item.test_name)
        if not series_rows:
            continue

        test_value_objs = [tv for tv, _ in series_rows]
        latest_tv = test_value_objs[-1]
        latest_status = get_status_color(latest_tv.value, latest_tv.ref_low, latest_tv.ref_high)

        t_res = calculate_trend(test_value_objs)
        sparkline_vals = [tv.value for tv in test_value_objs[-TREND_SPARKLINE_MAX_POINTS:]]

        overview_items.append(
            TrendOverviewItem(
                test_name=test_item.test_name,
                latest_value=latest_tv.value,
                latest_unit=latest_tv.unit,
                latest_status=latest_status,
                direction=t_res["direction"],
                sparkline=sparkline_vals,
                report_count=len(test_value_objs),
            )
        )

    return TrendOverviewResponse(
        profile_id=profile_id,
        health_score_trend=hs_summary,
        tests=overview_items,
    )


def get_trend_insight(db: Session, profile_id: int, test_name: str) -> TrendInsightResponse:
    """Return cached or newly generated template-based narrative health insight for a test parameter."""
    series_rows = _fetch_test_value_series(db, profile_id, test_name)
    test_value_objs = [tv for tv, _ in series_rows]
    current_count = len(test_value_objs)

    t_res = calculate_trend(test_value_objs)
    direction = t_res["direction"]
    latest_status = (
        get_status_color(test_value_objs[-1].value, test_value_objs[-1].ref_low, test_value_objs[-1].ref_high)
        if test_value_objs
        else None
    )

    existing = (
        db.query(TrendInsight)
        .filter(TrendInsight.profile_id == profile_id, TrendInsight.test_name == test_name)
        .first()
    )

    if existing and existing.based_on_report_count == current_count:
        return TrendInsightResponse(
            profile_id=existing.profile_id,
            test_name=existing.test_name,
            insight_text=existing.insight_text,
            direction=direction,
            based_on_report_count=existing.based_on_report_count,
            generated_at=existing.generated_at,
        )

    insight_text = _build_insight_text(test_name, direction, current_count, latest_status)

    if existing:
        existing.insight_text = insight_text
        existing.based_on_report_count = current_count
        existing.generated_at = func.now()
        db.commit()
        db.refresh(existing)
        target_obj = existing
    else:
        new_row = TrendInsight(
            profile_id=profile_id,
            test_name=test_name,
            insight_text=insight_text,
            based_on_report_count=current_count,
        )
        db.add(new_row)
        db.commit()
        db.refresh(new_row)
        target_obj = new_row

    return TrendInsightResponse(
        profile_id=target_obj.profile_id,
        test_name=target_obj.test_name,
        insight_text=target_obj.insight_text,
        direction=direction,
        based_on_report_count=target_obj.based_on_report_count,
        generated_at=target_obj.generated_at,
    )


def _fetch_test_value_series(db: Session, profile_id: int, test_name: str) -> list[tuple[ReportTestValue, Report]]:
    """Private helper to query completed test value points for a profile ordered chronologically."""
    return (
        db.query(ReportTestValue, Report)
        .join(Report, ReportTestValue.report_id == Report.id)
        .filter(
            Report.profile_id == profile_id,
            Report.status == REPORT_STATUS_COMPLETED,
            ReportTestValue.test_name == test_name,
            ReportTestValue.value.isnot(None),
        )
        .order_by(Report.report_date.asc().nulls_last(), Report.uploaded_at.asc())
        .all()
    )


def _build_insight_text(
    test_name: str, direction: str, report_count: int, latest_status: Optional[str]
) -> str:
    """Generate template-based narrative text for trend insights based on direction and status."""
    if direction == TREND_DIRECTION_INSUFFICIENT_DATA:
        return (
            f"Not enough data yet — upload at least {TREND_MIN_REPORTS_FOR_TREND} reports "
            f"with {test_name} to see a trend."
        )

    if direction == TREND_DIRECTION_REFERENCE_UNAVAILABLE:
        return (
            f"We don't have enough reference range data for {test_name} to calculate "
            f"a trend direction yet."
        )

    if direction == TREND_DIRECTION_STABLE:
        base = f"Your {test_name} has remained stable across your last {report_count} reports."
    elif direction == TREND_DIRECTION_INCREASING:
        base = f"Your {test_name} has been trending upward over your last {report_count} reports."
    elif direction == TREND_DIRECTION_DECREASING:
        base = f"Your {test_name} has been trending downward over your last {report_count} reports."
    else:
        base = f"Your {test_name} has been tracked across your last {report_count} reports."

    if latest_status == STATUS_RED:
        base += " This is currently outside the normal range — consider discussing it with a doctor."

    return base
