FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY data/ ./data/

# Expose port (Railway overrides this with $PORT at runtime)
EXPOSE 8000

# Production: run with uvicorn.
# Railway injects $PORT dynamically — we must honour it.
# Shell-form CMD (not exec-form) so the shell expands $PORT.
# Falls back to 8000 for local `docker run` without -e PORT.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --log-level info
