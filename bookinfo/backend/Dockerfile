FROM eclipse-temurin:21-jdk@sha256:949f7645022e8cd5cd65eac4b342e7505c86b721b6338f8b677c6f2edc180262 AS build

WORKDIR /workspace

WORKDIR /workspace/bookinfo/backend

COPY bookinfo/backend/gradlew gradlew
COPY bookinfo/backend/gradle gradle
COPY bookinfo/backend/settings.gradle bookinfo/backend/build.gradle bookinfo/backend/gradle.properties ./
COPY api/spec/bookinfo.yml /workspace/api/spec/bookinfo.yml

RUN sh ./gradlew --no-daemon dependencies

COPY bookinfo/backend/src src

RUN sh ./gradlew --no-daemon bootJar

FROM eclipse-temurin:21-jre@sha256:194b590649efee5555de080c634905a30c2885190210e37ada26370ed2a9c781

WORKDIR /app

RUN groupadd --system --gid 1001 spring \
    && useradd --system --uid 1001 --gid spring --home-dir /app --shell /usr/sbin/nologin spring

COPY --from=build --chown=1001:1001 /workspace/bookinfo/backend/build/libs/bookinfo-0.0.1-SNAPSHOT.jar /app/bookinfo.jar

USER 1001:1001

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080' || exit 1

ENTRYPOINT ["java", "-jar", "/app/bookinfo.jar"]
