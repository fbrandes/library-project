import {
  type CreateUserRequest,
  USER_ROLES,
  USER_STATUSES,
  type UpdateUserRequest,
  type UserRole,
  type UserStatus,
} from "../generated/userModels.js";
import { UserValidationError } from "./user.errors.js";

type UserInput = CreateUserRequest | UpdateUserRequest;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function isUserStatus(value: unknown): value is UserStatus {
  return (
    typeof value === "string" && USER_STATUSES.includes(value as UserStatus)
  );
}

export function normalizeUserInput(input: UserInput): UserInput {
  return {
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    role: input.role,
    status: input.status,
  };
}

export function validateUserId(id: string): string[] {
  return id.trim() === "" ? ["id is required"] : [];
}

export function validateUserInput(
  input: Partial<UserInput> | null | undefined,
): string[] {
  if (!input || typeof input !== "object") {
    return ["payload is required"];
  }

  const problems: string[] = [];
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const firstName =
    typeof input.firstName === "string" ? input.firstName.trim() : "";
  const lastName =
    typeof input.lastName === "string" ? input.lastName.trim() : "";

  if (email === "") {
    problems.push("email is required");
  } else if (!emailPattern.test(email)) {
    problems.push("email must be valid");
  }

  if (firstName === "") {
    problems.push("firstName is required");
  }
  if (lastName === "") {
    problems.push("lastName is required");
  }
  if (!isUserRole(input.role)) {
    problems.push("role is invalid");
  }
  if (!isUserStatus(input.status)) {
    problems.push("status is invalid");
  }

  return problems;
}

export function parseUserInput(
  input: Partial<UserInput> | null | undefined,
): UserInput {
  const problems = validateUserInput(input);
  if (problems.length > 0) {
    throw new UserValidationError(problems);
  }

  return normalizeUserInput(input as UserInput);
}

export function assertValidUserId(id: string): string {
  const normalized = id.trim();
  const problems = validateUserId(normalized);
  if (problems.length > 0) {
    throw new UserValidationError(problems);
  }
  return normalized;
}
