# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Собираем фронт (Vite создаёт dist/, CRA создаёт build/)
RUN npm run build

# Нормализуем путь артефактов в /out
RUN if [ -d "dist" ]; then \
      mv dist /out; \
    elif [ -d "build" ]; then \
      mv build /out; \
    else \
      echo "ERROR: build output not found (dist/ or build/)"; \
      ls -la; \
      exit 1; \
    fi

FROM nginx:alpine
# Кладём собранное в корень nginx
COPY --from=builder /out/ /usr/share/nginx/html/

# Конфиг nginx для SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
