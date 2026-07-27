FROM eclipse-temurin:25-jdk AS build

WORKDIR /workspace

COPY gateway/gradlew gateway/settings.gradle gateway/build.gradle ./gateway/
COPY gateway/gradle ./gateway/gradle
COPY gateway/src ./gateway/src

WORKDIR /workspace/gateway
RUN ./gradlew --no-daemon bootJar

FROM eclipse-temurin:25-jre

WORKDIR /app

RUN groupadd --system gateway \
    && useradd --system --gid gateway --home-dir /app --shell /usr/sbin/nologin gateway

COPY --from=build --chown=gateway:gateway /workspace/gateway/build/libs/gateway-0.0.1-SNAPSHOT.jar /app/gateway.jar

USER gateway

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/gateway.jar"]
