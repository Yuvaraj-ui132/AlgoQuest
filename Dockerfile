FROM python:3.11-slim

WORKDIR /app

# Install dependencies from backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code, data, and migrations
COPY backend/app/ ./app/
COPY backend/data/ ./data/
COPY backend/migrations/ ./migrations/

# Create non-root user and set permissions
RUN groupadd -r -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup -s /sbin/nologin -d /app appuser && \
    chown -R appuser:appgroup /app

USER appuser

# Dynamic port binding for Render / Railway / Docker ($PORT)
EXPOSE 8000

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --log-level info"]
