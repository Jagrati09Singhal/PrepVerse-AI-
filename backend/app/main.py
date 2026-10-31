from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.resumes import router as resumes_router
from app.api.job_analyses import router as job_analyses_router
from app.api.interviews import router as interviews_router
from app.api.analytics import router as analytics_router
from app.api.roadmap import router as roadmap_router
from app.api.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.core.database import engine, Base
        from sqlalchemy import text
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)

        # Safe automatic migration for existing database instances
        try:
            with engine.connect() as conn:
                res = conn.execute(text("PRAGMA table_info(preparation_plans)")).fetchall()
                col_names = [r[1] for r in res]
                new_cols = [
                    ("academic_year", "VARCHAR(50)"),
                    ("branch", "VARCHAR(100)"),
                    ("ongoing_subjects", "TEXT"),
                    ("core_interests", "TEXT"),
                ]
                for col_name, col_type in new_cols:
                    if col_name not in col_names:
                        conn.execute(text(f"ALTER TABLE preparation_plans ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
        except Exception as mig_exc:
            import logging
            logging.getLogger("uvicorn").debug(f"Table migration check note: {mig_exc}")
    except Exception as exc:
        import logging
        logging.getLogger("uvicorn").warning(f"Database initialization: {exc}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="PrepVerse AI API — Prepare Smarter. Practice Deeper. Become Interview-Ready.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register health check at both root /health and /api/v1/health
app.include_router(health_router)
app.include_router(health_router, prefix=settings.API_V1_PREFIX)

# Register Phase 1, 2, 3, 4, 5, and 6 routes under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(resumes_router, prefix=settings.API_V1_PREFIX)
app.include_router(job_analyses_router, prefix=settings.API_V1_PREFIX)
app.include_router(interviews_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(roadmap_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": getattr(settings, "TAGLINE", "Prepare Smarter. Practice Deeper. Become Interview-Ready."),
        "version": "1.0.0",
        "phase": "PrepVerse AI — Enterprise Brand Identity, Interactive UI & Scalability Upgrade",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "auth": f"{settings.API_V1_PREFIX}/auth",
            "resumes": f"{settings.API_V1_PREFIX}/resumes",
            "job_analyses": f"{settings.API_V1_PREFIX}/job-analyses",
            "interviews": f"{settings.API_V1_PREFIX}/interviews",
            "analytics": f"{settings.API_V1_PREFIX}/analytics",
            "roadmap": f"{settings.API_V1_PREFIX}/roadmap",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
