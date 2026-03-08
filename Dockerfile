FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y curl gnupg build-essential nginx && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/* 

COPY /nginx/nginx.conf /etc/nginx/nginx.conf

ARG ACCESS_TOKEN_EXPIRE_MINUTES
ARG SQLITE_PATH
ARG POSTGRES_URL
ARG SECRET_KEY
ARG ALGORITHM
ARG PROJECT_ENV

WORKDIR /app

COPY . .

ENV ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES}
ENV SQLITE_PATH=${SQLITE_PATH}
ENV POSTGRES_URL=${POSTGRES_URL}
ENV SECRET_KEY=${SECRET_KEY}
ENV ALGORITHM=${ALGORITHM}
ENV PROJECT_ENV=${PROJECT_ENV}

WORKDIR /app/frontend
# RUN npm install
# RUN npm run build

EXPOSE 10000

WORKDIR /app
RUN npm install

# File Testing
RUN pwd && ls -la
RUN find /app -maxdepth 3 -type d
RUN which python || true
RUN python --version || true

CMD ["npm", "run", "docker-setup"]