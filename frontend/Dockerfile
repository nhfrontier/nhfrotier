# syntax=docker/dockerfile:1
#
# NH위드캔버스 Frontend — 폐쇄망 반입용 이미지.
# 규칙은 backend/Dockerfile 과 같다: 다이제스트 고정, linux/amd64, 비루트, 실행 전용.

# ---------- 1) 빌드 (개발망 전용) ----------
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS builder

WORKDIR /build

# 의존성 레이어를 소스와 분리한다. 소스만 바뀌면 npm ci 를 건너뛴다.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- 2) 실행 ----------
FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10

ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
LABEL org.opencontainers.image.title="nh-canvas-frontend" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.created="${BUILD_TIME}"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html

# nginx:alpine 에는 nginx(uid 101) 사용자가 이미 있다. 비루트로 돌리려면 쓰기 경로가 필요하다.
RUN touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
