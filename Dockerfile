FROM python:3.12-slim

# System deps (includes tzdata for ZoneInfo)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/Paris

WORKDIR /app

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire project
COPY . .

# Create runtime directories that may not exist in the repo
RUN mkdir -p conversations

# Make start script executable
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]