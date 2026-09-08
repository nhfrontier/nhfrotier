# syntax=docker/dockerfile:1
#
# NH위드캔버스 Backend — 폐쇄망 반입용 이미지.
#
# 빌드는 개발망에서만 돈다. 폐쇄망에는 `docker save` 로 만든 tar 를 반입해 `docker load` 로
# 되살려 **실행만** 한다. 아래 builder 스테이지는 최종 이미지에 포함되지 않으므로
# 반입한 이미지로는 재빌드할 수 없다. 이것이 의도한 동작이다.
#
# 베이스 이미지는 태그가 아니라 다이제스트로 고정한다. 태그는 나중에 다른 이미지를 가리키므로
# 반입 심사와 재현성이 무너진다.
#
# 반드시 `--platform linux/amd64` 로 빌드할 것. ARM 맥에서 그냥 빌드하면 반입 후
# `exec format error` 로 죽는다. scripts/build-release.mjs 가 이 옵션을 강제한다.

# ---------- 1) 빌드 (개발망 전용) ----------
FROM maven:3.9-eclipse-temurin-21@sha256:8f6ac126f7810bb5549c4cd122d2bf0e9cda5bdeb0838aa928f09e779fd8bef8 AS builder

WORKDIR /build

# 의존성 레이어를 소스와 분리한다. 소스만 바뀌면 내려받기를 건너뛴다.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package \
 && mv target/canvas-backend-*.jar target/app.jar

# ---------- 2) 실행 ----------
FROM eclipse-temurin:21-jre@sha256:7a65df4b22d2de92d4e04056e884f3b9122d70b21e2847fd66084278bd0ce037

ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
LABEL org.opencontainers.image.title="nh-canvas-backend" \
      org.opencontainers.image.version="0.1.0-SNAPSHOT" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.created="${BUILD_TIME}"

# root 로 실행하지 않는다 (SECURITY A-3 최소권한).
RUN groupadd --system --gid 10001 canvas \
 && useradd --system --uid 10001 --gid canvas --home-dir /app --shell /usr/sbin/nologin canvas

WORKDIR /app
COPY --from=builder --chown=canvas:canvas /build/target/app.jar /app/app.jar

# 파일 저장소는 컨테이너 밖 볼륨이다. 애플리케이션은 stateless 로 유지한다.
# 인스턴스를 여러 개 띄우려면 이 경로가 공유 마운트여야 한다 (ARCHITECTURE 7절).
ENV FILE_STORAGE_PATH=/var/storage
RUN mkdir -p /var/storage && chown canvas:canvas /var/storage

USER canvas
EXPOSE 8080

# 힙을 고정값으로 굽지 않는다. 컨테이너에 준 메모리에 비례해 잡는다.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

# Flyway 마이그레이션이 기동 시 돌아 첫 기동이 느리다. start-period 를 넉넉히 준다.
HEALTHCHECK --interval=15s --timeout=3s --start-period=90s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${SERVER_PORT:-8080}/actuator/health" || exit 1

# exec 로 넘겨 JVM 이 PID 1 이 되게 한다. 그래야 SIGTERM 에 정상 종료한다.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
