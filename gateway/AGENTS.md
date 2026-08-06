# Repository Guidelines

## Project Overview

This repository contains the API gateway microservice. It is written in Java w/ Spring Cloud Gateway

## Project Structure

- `src/`: The API gateway code
- `keycloak/`: Configs for Keycloak
- `oauth2-proxy/`: Configs for Oauth2 Proxy

## Build, Test and Development Commands

- ./gradlew bootRun: starts gateway
- ./gradlew test: runs unit and integration tests.

## Technical Stack

### Backend

- Language: Java 25
- Framework: Spring Cloud Gateway
- Build Tool: Gradle
- Style: Reactive
- Testing: JUnit 5, Mockito, Testcontainers

## Setup commands

## Coding Guidelines

When assisting with code generation or modifications, adhere to the following rules:

### Backend Development Rules

TODO

## Workflow

- Ensure code adheres to the conventional commits specification, as enforced by `commitlint` and `commitguard`.
