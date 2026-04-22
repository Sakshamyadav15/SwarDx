FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for audio processing and ML
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY api_server.py .
COPY sample.py .
COPY opxg_model.json .
COPY scaler.pkl .
COPY threshold.txt .
COPY feature_names.csv .

# Create models directory for potential future use
RUN mkdir -p /app/models

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/docs || exit 1

# Expose the port
EXPOSE 8000

# Run the FastAPI application
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]
