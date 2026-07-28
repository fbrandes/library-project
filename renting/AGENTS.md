# Repository Guidelines

## Project Overview
This repository contains the book renting microservice. It is divided into two primary modules:

## Project Structure
- `backend/`: Go + Postgres
- `frontend/`: Svelte w/ with Vite

## Build, Test and Development Commands
- `cd backend && `: starts backend and local dependencies via Docker Compose.
- `cd backend && make test` : runs unit and integration tests.
- `cd backend && make cover` : runs tests with coverage.
- `cd frontend && npm run dev`: starts Vite dev server.
- `cd frontend && npm run build`: TypeScript compile + production build.
- `cd frontend && npm test`: runs Vitest unit tests once.
- `cd frontend && npm run test:coverage`: runs tests with coverage.

## Technical Stack
### Backend
- Language: Go
- Build Tool: Makefile
- Database: Postgres
- API Strategy: OpenAPI first (generated DTOs and API interfaces)
- Testing: go testing, Testcontainers

### Frontend
- Framework: Svelte
- Build Tool: Vite
- Language: TypeScript

## Setup commands

## Coding Guidelines
When assisting with code generation or modifications, adhere to the following rules:

### Backend Development Rules
- prefer golang std library over external dependencies

## Workflow
- Ensure code adheres to the conventional commits specification, as enforced by `commitlint` and `commitguard`.

