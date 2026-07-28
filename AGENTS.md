# Repository Guidelines

## Project Overview
This repository contains a microservice application that provides a digital library experience. It provides an interface to search for and rent books.
Each microservice is a full stack application with its own frontend and backend and resides in its own subfolder in this project.

## Project Structure
- `bookinfo`: microservice that manages book data
- `renting`: microservice that handles renting of books
- `user-management`: microservice that user registration and management
- `gateway`: api gateway microservice that handles authentication and routes requests
- `api`: contains api specifications and a Bruno collection for sending requests to backend applications
- `system-tests`: contains tests written using Playwright that test the whole application flow

## Tech Stack
###  BookInfo Microservice
- Language: Kotlin + Spring Boot & React
- Database: MongoDB
- API Strategy: OpenAPI

###  Renting Microservice
- Language: Go & Svelte
- Database: Postgres
- API Strategy: OpenAPI

###  User Management Microservice
- Language: NodeJS & Vue
- Database: Postgres
- API Strategy: OpenAPI

###  Application Gateway
- Language: Java + Spring Cloud Gateway
- Authentication: OAuth2 Proxy & Keycloak
- Authentication Mechanism: Token-based w/ JWT

## General Coding Style
- Frontends & NodeJS Backends use Typescript strict mode
- Single quotes
- Use functional patterns where possible
- Follow `.editorconfig`: UTF-8, LF, spaces with 2-space indentation, trailing newline
- Name tests by intent an target, for example `BookControllerIntegrationTest` and `HomeButton.test.tsx`
- Run linters like `npm run lint` for Frontends or `ktlint` for Kotlin Backends

## Testing Guidelines
- Frontend unit tests use Vitest + Testing Library; keep tests deterministic nd colocated in `src/`
- Backend integration tests use `Testcontainers` for testing against databases, authentication providers or other external components that are part of the system
- Dependencies outside of the system (for example external data providers like OpenLibrary) are mocked in tests
- Add or adjust tests with behavior changes; prioritize API contract and persistence coverage.
- For test data use specmatic to generate random data from the api specs.
- Test Coverage should be above 90%

## Commit & Pull Request Guidelines
- Commits must follow Conventional Commits (commitlint): feat:, fix:, chore:, docs:, refactor:, test:, style:.
- Keep commits focused and descriptive; reference ticket IDs when applicable.
- PRs should include purpose, key changes, test evidence (commands/results), and screenshots for UI changes.
- Link related issues and call out configuration or migration impacts.

# Security & Configuration Tips
- Never commit secrets; use environment variables and secret stores.
- Review docker-compose.yaml, Keycloak config, and Helm values before changing auth or exposure-related settings.
