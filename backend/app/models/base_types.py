from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

# PostgreSQL uses JSONB for optimized querying, while SQLite / other dialects fall back to standard JSON
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")

