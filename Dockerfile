# ==============================================================================
# PrepVerse AI — Production Multi-Stage Container Dockerfile
# Stage 1: Build React 18 + Vite Frontend Client
# Stage 2: Serve via FastAPI ASGI Production Runtime
# ==============================================================================

# Stage 1: Build Frontend SPA
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend Runtime
FROM python:3.11-slim
LABEL maintainer="PrepVerse AI Engineering Team"
LABEL description="PrepVerse AI - Adaptive Technical Interview & Semester Diagnostic Platform"

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code and compiled frontend assets
COPY backend/ backend/
COPY --from=frontend-builder /app/frontend/dist frontend/dist

EXPOSE 8000

# Health check to verify service responsiveness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

CMD ["sh", "-c", "cd backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
