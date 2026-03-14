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

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]