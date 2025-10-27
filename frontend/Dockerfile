# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build  # Vite: создаёт dist; CRA: создаёт build

FROM nginx:alpine
# Vite:
COPY --from=builder /app/dist /usr/share/nginx/html
# Если CRA, замени строку выше на:
# COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
