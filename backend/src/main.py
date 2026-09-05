from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.exceptions import register_exception_handlers
from src.database import Base, create_upload_dir, engine

app = FastAPI(title="Mediora API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

register_exception_handlers(app)


@app.on_event("startup")
def on_startup():
    import src.models.user  # noqa: F401
    import src.models.profile  # noqa: F401
    import src.models.report  # noqa: F401
    import src.models.reference_range  # noqa: F401
    import src.models.missing_reference_log  # noqa: F401
    import src.models.translation  # noqa: F401
    import src.models.test_name_alias  # noqa: F401
    import src.models.recommendation  # noqa: F401
    import src.models.trend_insight  # noqa: F401
    import src.models.share_link  # noqa: F401
    import src.models.explanation_cache  # noqa: F401
    import src.models.nutrition  # noqa: F401

    Base.metadata.create_all(bind=engine)
    create_upload_dir()


from src.features.auth.router import router as auth_router
from src.features.report_extraction.router import router as reports_router, root_router as reports_root_router
from src.features.report_extraction.router import reference_router
from src.features.health_dashboard.router import router as dashboard_router, root_router as dashboard_root_router
from src.features.translation.router import router as translation_router
from src.features.species_support.router import router as species_router
from src.features.recommendations.router import router as recommendations_router, root_router as recommendations_root_router
from src.features.recommendations.diet_router import router as diet_router
from src.features.trend_tracking.router import router as trend_router
from src.features.secure_sharing.router import (
    owner_router as share_owner_router,
    public_router as share_public_router,
    public_root_router as share_public_root_router,
)
from src.features.ai_explanations.router import router as explanations_router

app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(reports_root_router)
app.include_router(reference_router)
app.include_router(dashboard_router)
app.include_router(dashboard_root_router)
app.include_router(translation_router)
app.include_router(species_router)
app.include_router(recommendations_router)
app.include_router(recommendations_root_router)
app.include_router(diet_router)
app.include_router(trend_router)
app.include_router(share_owner_router)
app.include_router(share_public_router)
app.include_router(share_public_root_router)
app.include_router(explanations_router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
