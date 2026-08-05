// Generated from api/spec/user-management.json. Do not edit manually.

export const USER_ROLES = ["USER", "ADMIN", "LIBRARIAN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["REGISTERED", "ACTIVE", "INACTIVE"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
}

export interface UpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
}

export interface ErrorResponse {
  message: string;
  problems?: string[];
}
