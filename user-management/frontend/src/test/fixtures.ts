import type { CreateUserRequest, User } from "../generated/userModels";

export const userId = "550e8400-e29b-41d4-a716-446655440000";

export function userInput(
  overrides: Partial<CreateUserRequest> = {},
): CreateUserRequest {
  return {
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    role: "LIBRARIAN",
    status: "ACTIVE",
    ...overrides,
  };
}

export function user(overrides: Partial<User> = {}): User {
  return {
    id: userId,
    ...userInput(),
    createdAt: "2026-06-22T09:00:00.000Z",
    updatedAt: "2026-06-22T10:00:00.000Z",
    ...overrides,
  };
}
