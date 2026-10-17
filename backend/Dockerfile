FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code, data, and migrations
COPY app/ ./app/
COPY data/ ./data/
COPY migrations/ ./migrations/

# Create non-root user and set permissions
RUN groupadd -r -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup -s /sbin/nologin -d /app appuser && \
    chown -R appuser:appgroup /app

USER appuser

# Expose port (dynamic binding for cloud runners / local dev)
EXPOSE 8000

# Run with uvicorn ($PORT dynamic override, defaults to 8000)
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --log-level info"]
