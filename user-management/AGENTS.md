# Repository Guidelines

## Project Overview

This repository contains the user management microservice. It is divided into two primary modules:

## Project Structure

- `backend/`: NodeJS + Postgres
- `frontend/`: Vue w/ with Vite

## Build, Test and Development Commands

- `cd backend && npm run start`: starts Vite dev server.
- `cd backend && npm run build`: API model build + TypeScript compile + production build.
- `cd backend && npm test`: runs Vitest unit tests once.
- `cd backend && npm run test:coverage`: runs unit tests with coverage.
- `cd backend && npm run test:integration`: runs integration tests with coverage.

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
- Testing: Vitest, Testing Library, Testcontainers

## Setup commands

## Coding Guidelines

When assisting with code generation or modifications, adhere to the following rules:

### Backend Development Rules

- TBD

## Workflow

- Ensure code adheres to the conventional commits specification, as enforced by `commitlint` and `commitguard`.
