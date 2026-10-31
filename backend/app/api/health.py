from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.database import check_db_connectivity
from app.schemas.health import HealthCheckResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": HealthCheckResponse,
            "description": "Database connectivity failed or service is unhealthy",
        }
    },
)
def get_health(response: Response) -> HealthCheckResponse:
    """
    Health check endpoint.
    Verifies that the API service is running and tests connectivity to the database.
    Returns 200 OK if healthy, or 503 Service Unavailable if database connection fails.
    """
    db_healthy, db_error = check_db_connectivity()

    if not db_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthCheckResponse(
            status="unhealthy",
            database="disconnected",
            version="0.1.0",
            environment=settings.ENVIRONMENT,
            error=db_error,
        )

    return HealthCheckResponse(
        status="healthy",
        database="connected",
        version="0.1.0",
        environment=settings.ENVIRONMENT,
        error=None,
    )

