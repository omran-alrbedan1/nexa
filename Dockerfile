# ── Stage 1: Base ──
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Builder ──
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_REVERB_APP_ID
ENV VITE_REVERB_APP_ID=$VITE_REVERB_APP_ID
ARG VITE_REVERB_KEY
ENV VITE_REVERB_KEY=$VITE_REVERB_KEY
ARG VITE_REVERB_SECRET
ENV VITE_REVERB_SECRET=$VITE_REVERB_SECRET
ARG VITE_REVERB_HOST
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

RUN npm run build

# ── Stage 3: Runner (Nginx) ──
FROM nginx:stable-alpine AS runner

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Install wget for healthcheck (nginx:stable-alpine doesn't include it)
RUN apk add --no-cache wget

# Security: ensure nginx can read the files (nginx master runs as root, workers as nginx)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
  chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
