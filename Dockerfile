FROM python:3.11-slim

WORKDIR /app

# Install dependencies from backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code and data
COPY backend/app/ ./app/
COPY backend/data/ ./data/

# Dynamic port binding for Render / Railway ($PORT)
EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --log-level info
