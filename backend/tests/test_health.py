from unittest.mock import patch
from fastapi import Response, status
from app.main import root
from app.api.health import get_health
from app.core.database import check_db_connectivity


def test_root_endpoint():
    """Test root endpoint returns API metadata."""
    data = root()
    assert data["name"] == "PrepVerse AI"
    assert "PrepVerse AI" in data["phase"]
    assert data["version"] == "1.0.0"
    assert data["health"] == "/health"
    assert data["docs"] == "/docs"
    assert "endpoints" in data
    assert "interviews" in data["endpoints"]
    assert "analytics" in data["endpoints"]
    assert "roadmap" in data["endpoints"]


def test_health_check_healthy():
    """Test GET /health returns 200 when database connectivity succeeds."""
    with patch("app.api.health.check_db_connectivity", return_value=(True, None)):
        response = Response()
        result = get_health(response)
        assert response.status_code == status.HTTP_200_OK
        assert result.status == "healthy"
        assert result.database == "connected"
        assert result.version == "0.1.0"
        assert result.error is None


def test_health_check_unhealthy():
    """Test GET /health returns 503 when database is unreachable."""
    err_msg = "Connection to server at localhost:5432 failed: Connection refused"
    with patch("app.api.health.check_db_connectivity", return_value=(False, err_msg)):
        response = Response()
        result = get_health(response)
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert result.status == "unhealthy"
        assert result.database == "disconnected"
        assert result.version == "0.1.0"
        assert result.error == err_msg


def test_check_db_connectivity_failure_handling():
    """Test check_db_connectivity handles database errors cleanly."""
    with patch("app.core.database.engine.connect", side_effect=Exception("Database timeout")):
        is_healthy, error_msg = check_db_connectivity()
        assert is_healthy is False
        assert "Database timeout" in error_msg
