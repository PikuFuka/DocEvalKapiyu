FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
# - gcc, libpq-dev: for PostgreSQL (psycopg2)
# - tesseract-ocr: for OCR (pytesseract)
# - libgl1, libglib2.0-0: for OpenCV/image processing
# - poppler-utils: for pdf2image
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
# Increase timeout because torch/transformers are large
RUN pip install --no-cache-dir --default-timeout=300 -r requirements.txt

# Copy application code (respects .dockerignore - excludes venom/)
COPY . .

# Create media directory if it doesn't exist
RUN mkdir -p /app/media

# Expose port
EXPOSE 8000

# Default command (can be overridden in docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]