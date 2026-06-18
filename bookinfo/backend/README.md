# Bookinfo

Kotlin Spring Boot service for storing book information in MongoDB.

## Build

This project uses the Gradle wrapper and requires JDK 21 or newer.

```sh
./gradlew test
./gradlew ktlintCheck
./gradlew ktlintFormat
./gradlew check
```

`./gradlew check` runs ktlint, unit tests, and enforces a minimum 90% line coverage
threshold with JaCoCo.

## Run

Start the service and MongoDB with Docker Compose from the repository root:

```sh
docker compose up --build
```

The Compose file binds MongoDB to localhost and uses local development credentials.
Override them with `BOOKINFO_MONGO_USERNAME` and `BOOKINFO_MONGO_PASSWORD` when needed.

For a manually managed MongoDB instance, configure `SPRING_MONGODB_URI` and run:

```sh
./gradlew bootRun
```

The REST API is described in `../../api/spec/bookinfo.yml`. API model
classes are generated into `src/generated` during the Gradle build. `./gradlew clean`
deletes that generated directory.
