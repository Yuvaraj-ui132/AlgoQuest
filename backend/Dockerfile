FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code, data, and migrations
COPY app/ ./app/
COPY data/ ./data/
COPY migrations/ ./migrations/

# Expose port (dynamic binding for cloud runners / local dev)
EXPOSE 8000

# Run with uvicorn ($PORT dynamic override, defaults to 8000)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --log-level info
