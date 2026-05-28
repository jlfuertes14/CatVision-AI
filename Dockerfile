# Stage 1: Build the Next.js Frontend
FROM node:20-alpine AS builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
# Pass an empty string so the frontend API calls use relative paths (e.g. /api/predict)
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# Stage 2: Setup FastAPI Backend
FROM python:3.11-slim

# Create a non-root user for Hugging Face Spaces
RUN useradd -m -u 1000 user

# Install system dependencies (required for PyTorch/OpenCV if used)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Switch to the non-root user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /home/user/app/backend

# Copy backend requirements and install
COPY --chown=user backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code (including models and breeds.json)
COPY --chown=user backend/ ./

# Create a static folder and copy the built frontend files into it
RUN mkdir -p static
COPY --from=builder --chown=user /app/frontend/out ./static

# Expose the Hugging Face Space default port
EXPOSE 7860

# Command to run the FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
