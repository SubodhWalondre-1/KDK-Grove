"""F2 Health Dashboard service — assembles dashboard data from persisted report + computed severity."""

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from src.core.constants import (
    FEATURED_TREND_TESTS,
    REPORT_STATUS_COMPLETED,
    REPORT_STATUS_FAILED,
    REPORT_STATUS_PROCESSING,
    STATUS_GREEN,
    STATUS_RED,
    STATUS_YELLOW,
)
from src.core.exceptions import ReportNotFoundError
from src.core.severity import (
    calculate_health_score,
    get_health_score_label,
    get_status_color,
)
from src.models.report import Report, ReportTestValue
from src.schemas.dashboard import (
    DashboardResponse,
    ProfileHealthScoreResponse,
    StatusRatio,
    TestValueWithStatus,
    TrendSeries,
)


def get_dashboard_data(db: Session, report_id: int) -> DashboardResponse:
    """Assemble full dashboard payload for a single report."""
    report = (
        db.query(Report)
        .options(joinedload(Report.test_values), joinedload(Report.profile))
        .filter(Report.id == report_id)
        .first()
    )
    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")

    if report.status == REPORT_STATUS_PROCESSING:
        raise HTTPException(
            status_code=409,
            detail=f"Report {report_id} is still processing. Please check status at /api/reports/{report_id}/status",
        )
    elif report.status == REPORT_STATUS_FAILED:
        raise HTTPException(
            status_code=400,
            detail=f"Report {report_id} processing failed. Please re-upload or reprocess.",
        )

    # Step 2: compute status for each test value
    test_values_with_status = []
    for tv in report.test_values:
        computed_status = tv.status
        if computed_status is None and tv.value is not None:
            computed_status = get_status_color(tv.value, tv.ref_low, tv.ref_high)

        test_values_with_status.append(
            TestValueWithStatus(
                id=tv.id,
                test_name=tv.test_name,
                value=tv.value,
                unit=tv.unit,
                ref_low=tv.ref_low,
                ref_high=tv.ref_high,
                status=computed_status,
                is_manually_corrected=tv.is_manually_corrected,
            )
        )

    # Step 3: abnormal values (non-green, non-None)
    abnormal_values = [
        tv for tv in test_values_with_status
        if tv.status is not None and tv.status != STATUS_GREEN
    ]

    # Step 4: status ratio (None excluded entirely)
    normal_count = 0
    borderline_count = 0
    abnormal_count = 0
    for tv in test_values_with_status:
        if tv.status == STATUS_GREEN:
            normal_count += 1
        elif tv.status == STATUS_YELLOW:
            borderline_count += 1
        elif tv.status == STATUS_RED:
            abnormal_count += 1

    status_ratio = StatusRatio(
        normal=normal_count,
        borderline=borderline_count,
        abnormal=abnormal_count,
    )

    # Step 5: parameter trend across all completed reports for this profile
    parameter_trend = _build_parameter_trend(db, report.profile_id)

    # Step 6: health_score from persisted value (do NOT recompute unless missing)
    health_score = report.health_score
    if health_score is None and report.test_values:
        health_score = calculate_health_score(report.test_values)
        report.health_score = health_score
        db.commit()

    # Step 7: label
    health_score_label = get_health_score_label(health_score)

    # Step 8: health insights
    health_insights = None
    try:
        from src.features.recommendations.service import get_recommendations
        health_insights = get_recommendations(db, report.id)
    except Exception:
        pass

    profile = report.profile
    profile_name = profile.profile_name if profile else None
    species = profile.species if profile else None
    species_category = profile.species_category if profile else None
    gender = profile.gender if profile else None

    return DashboardResponse(
        report_id=report.id,
        id=report.id,
        profile_id=report.profile_id,
        profile_name=profile_name,
        species=species,
        species_category=species_category,
        gender=gender,
        report_date=report.report_date,
        health_score=health_score,
        health_score_label=health_score_label,
        test_values=test_values_with_status,
        abnormal_values=abnormal_values,
        status_ratio=status_ratio,
        parameter_trend=parameter_trend,
        health_insights=health_insights,
        insights=health_insights,
    )


def get_profile_health_score(db: Session, profile_id: int) -> ProfileHealthScoreResponse:
    """Return the latest health score for a profile, or all-None if no completed reports exist."""
    report = (
        db.query(Report)
        .filter(
            Report.profile_id == profile_id,
            Report.status == REPORT_STATUS_COMPLETED,
        )
        .order_by(
            Report.report_date.desc().nullslast(),
            Report.uploaded_at.desc(),
        )
        .first()
    )

    if report is None:
        return ProfileHealthScoreResponse(
            profile_id=profile_id,
            latest_report_id=None,
            latest_health_score=None,
            latest_report_date=None,
        )

    return ProfileHealthScoreResponse(
        profile_id=profile_id,
        latest_report_id=report.id,
        latest_health_score=report.health_score,
        latest_report_date=report.report_date,
    )


def _build_parameter_trend(db: Session, profile_id: int) -> TrendSeries:
    reports = (
        db.query(Report)
        .options(joinedload(Report.test_values))
        .filter(
            Report.profile_id == profile_id,
            Report.status == REPORT_STATUS_COMPLETED,
        )
        .order_by(
            Report.report_date.asc().nullslast(),
            Report.uploaded_at.asc(),
        )
        .all()
    )

    labels = []
    # Map: test_name -> list of values (one per report, None if missing)
    trend_data: dict[str, list[float | None]] = {
        name: [] for name in FEATURED_TREND_TESTS
    }

    for report in reports:
        date_str = (
            report.report_date.strftime("%b %Y")
            if report.report_date
            else report.uploaded_at.strftime("%b %Y")
        )
        labels.append(date_str)

        # Build a lookup for this report's test values
        tv_map = {tv.test_name: tv.value for tv in report.test_values}

        for test_name in FEATURED_TREND_TESTS:
            trend_data[test_name].append(tv_map.get(test_name))

    datasets = [
        {"label": test_name, "data": trend_data[test_name]}
        for test_name in FEATURED_TREND_TESTS
    ]

    return TrendSeries(labels=labels, datasets=datasets)
