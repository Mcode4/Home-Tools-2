FROM node:20 AS frontend-build

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build

FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y nginx && \
    rm -rf /var/lib/apt/lists/* 

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend

COPY --from=frontend-build /frontend/dist /var/www/frontend

COPY /nginx/nginx.conf /etc/nginx/nginx.conf

ARG ACCESS_TOKEN_EXPIRE_MINUTES
ARG SQLITE_PATH
ARG POSTGRES_URL
ARG SECRET_KEY
ARG ALGORITHM
ARG PROJECT_ENV

ENV ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES}
ENV SQLITE_PATH=${SQLITE_PATH}
ENV POSTGRES_URL=${POSTGRES_URL}
ENV SECRET_KEY=${SECRET_KEY}
ENV ALGORITHM=${ALGORITHM}
ENV PROJECT_ENV=${PROJECT_ENV}

# File Testing
RUN pwd && ls -la
RUN find /app -maxdepth 3 -type d
RUN which python || true
RUN python --version || true

COPY start.sh .

EXPOSE 10000

WORKDIR /app
RUN npm install

# File Testing
RUN pwd && ls -la
RUN find /app -maxdepth 3 -type d
RUN which python || true
RUN python --version || true

CMD ["sh", "start.sh"]