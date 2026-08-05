# Repository Guidelines

## Project Overview

This repository contains the BookInfo microservice. It is divided into two primary modules:

## Project Structure

- `backend/`: Spring Boot 4 + Kotlin backend
- `frontend/`: React w/ Vite

## Build, Test and Development Commands

- cd backend && ./gradlew bootRun: starts backend and local dependencies via Docker Compose.
- cd backend && ./gradlew test: runs unit and integration tests.
- cd frontend && npm run dev: starts Vite dev server.
- cd frontend && npm run build: TypeScript compile + production build.
- cd frontend && npm test: runs Vitest unit tests once.
- cd frontend && npm run test:coverage: runs tests with coverage and Sonar report output.

## Technical Stack

### Backend

- Language: Kotlin (Java 25)
- Framework: Spring Boot 4
- Build Tool: Gradle
- Database: MongoDB
- Architecture: Layered (Controller -> Service -> Repository)
- API Strategy: OpenAPI first (generated DTOs and API interfaces)
- Dependency Injection: Constructor-based
- Mapping: MapStruct
- Testing: JUnit 5, Mockito, Testcontainers

### Frontend

- Framework: React
- Build Tool: Vite
- Language: TypeScript

## Setup commands

## Coding Guidelines

When assisting with code generation or modifications, adhere to the following rules:

### Backend (Java) Development Rules

1. **API & Controllers**
   - **Do NOT** create DTOs manually. Use classes generated from OpenAPI `.yaml` specifications (located in `src/generated/kotlin`).
   - Implement generated interfaces (e.g., `*Api`) in `@RestController` classes.
   - Controllers handle HTTP routing, DTO mapping, and delegate business logic to Services.

2. **Dependency Injection & Architecture**
   - Fields should be `private final`.
   - **Do NOT** use `@Autowired` or setter injection.
   - **Services**: Contain business logic, use `@Transactional`, and throw custom exceptions.
   - **Repositories**: Spring Data JPA interfaces extending `JpaRepository`. No implementation classes.

3. **Persistence (Hibernate / JPA)**
   - Entities use `@Entity`, `@Table`, `@Id`, `@Column`.
   - **Do NOT** put business logic inside entities.
   - Repository methods should follow Spring Data naming conventions (e.g., `findBy[Property]And[Property]`).

4. **Mapping & Utilities**
   - Use **MapStruct** for mapping. Configure it with `componentModel = "spring"`.
   - Inject Mappers into Services to convert between Entities and Generated DTOs.
   - Use `Optional.orElseThrow()` for handling nulls in Streams/Repositories.
   - Use Lombok extensively (`@Data`, `@Slf4j`, `@Builder`).

5. **Testing**
   - Framework: JUnit 5 & Mockito.
   - Use annotations: `@ExtendWith(MockitoExtension::class)`, `@Mock`, `@InjectMocks`.
   - Naming convention: `should[Behavior]_when[Condition]`.
   - Use `org.junit.jupiter.api.Assertions` for assertions.

## Workflow

- Ensure code adheres to the conventional commits specification, as enforced by `commitlint` and `commitguard`.
