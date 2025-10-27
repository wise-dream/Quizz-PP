# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

# Пакеты
COPY package*.json ./
# Для сборки часто нужны devDeps, поэтому БЕЗ --only=production
RUN npm ci

# Исходники
COPY . .

# Сборка (react-scripts/vite и т.п.)
RUN npm run build

# ===== Runtime =====
FROM nginx:alpine
# Если react-scripts: артефакт обычно в /app/build
# Если vite: чаще /app/dist
# Оставляю как у тебя — /build. При необходимости поменяй на /dist.
COPY --from=builder /app/build /usr/share/nginx/html

# Свой nginx.conf можно положить рядом и копировать ниже
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
