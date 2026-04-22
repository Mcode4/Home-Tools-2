FROM python:3.11

WORKDIR /backend

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ----------------------------
# File Testing
# ----------------------------
RUN pwd && ls -la
RUN find /backend -maxdepth 3 -type d
RUN which python || true
RUN python --version || true

# Use shell form of CMD to allow environment variable expansion
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${BACKEND_INTERNAL_PORT:-8000}"