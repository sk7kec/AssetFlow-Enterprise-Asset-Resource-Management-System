# ─────────────────────────────────────────────────────────────────────────────
# AssetFlow Backend — Dockerfile
# Multi-stage build for a lean, secure production image.
#
# Build:  docker build -t assetflow-backend .
# Run:    docker run -p 8000:8000 --env-file .env assetflow-backend
# ─────────────────────────────────────────────────────────────────────────────

# ─── Stage 1: Dependency Builder ─────────────────────────────────────────────
FROM python:3.12-slim AS builder

# Prevent Python from writing .pyc files and buffer stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt


# ─── Stage 2: Production Runtime ─────────────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install runtime system dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 assetflow && \
    useradd --uid 1001 --gid assetflow --no-create-home --shell /sbin/nologin assetflow

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY --chown=assetflow:assetflow . .

# Create required directories with correct ownership
RUN mkdir -p uploads/images uploads/documents uploads/codes/qr uploads/codes/barcode \
             uploads/maintenance logs && \
    chown -R assetflow:assetflow uploads logs

# Switch to non-root user
USER assetflow

# Expose port
EXPOSE 8000

# Health check (uses the /health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()" || exit 1

# Production startup command
# Workers = (2 * CPU_cores) + 1 for I/O-bound async FastAPI
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--loop", "uvloop", \
     "--http", "httptools", \
     "--log-level", "info", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
