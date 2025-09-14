FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file (if it exists)
COPY analytics/requirements.txt* ./

# Install Python dependencies (if requirements.txt exists)
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# Copy source code
COPY analytics/ .

# Create directories for reports and charts
RUN mkdir -p /app/reports /app/charts

EXPOSE 8001

CMD ["python", "main.py"]