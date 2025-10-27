# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Собираем фронт: Vite => dist/, CRA => build/
RUN npm run build

# Нормализуем вывод в /out
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
COPY --from=builder /out/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
