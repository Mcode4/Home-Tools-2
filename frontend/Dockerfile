FROM node:20-alpine AS build
WORKDIR /app
# COPY package*.json ./
COPY . .

# ----------------------------
# File Testing
# ----------------------------
RUN pwd && ls -la
RUN find /app -maxdepth 3 -type d
RUN which python || true
RUN python --version || true

RUN npm install
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
# Copy default.conf as a template for envsubst
COPY default.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
