import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const specPath = resolve(root, 'api/spec/user-management.json');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const schemas = spec.components.schemas;

const roleValues = schemas.UserRole.enum;
const statusValues = schemas.UserStatus.enum;

const generated = `// Generated from api/spec/user-management.json. Do not edit manually.

export const USER_ROLES = ${JSON.stringify(roleValues)} as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ${JSON.stringify(statusValues)} as const;
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
`;

const outputs = [
  resolve(root, 'user-management/backend/src/generated/userModels.ts'),
  resolve(root, 'user-management/frontend/src/generated/userModels.ts'),
];

for (const output of outputs) {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, generated);
}
