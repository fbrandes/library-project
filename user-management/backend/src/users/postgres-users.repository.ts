import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import type { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { USER_MANAGEMENT_POOL } from "../database/database.module.js";
import type {
  CreateUserRequest,
  User,
  UserRole,
  UserStatus,
} from "../generated/userModels.js";
import type { UsersRepository } from "./users.repository.js";

type UserRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date | string;
  updated_at: Date | string;
};

const userColumns = `
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at,
  updated_at
`;

export function toIsoString(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

@Injectable()
export class PostgresUsersRepository
  implements UsersRepository, OnModuleInit, OnModuleDestroy
{
  constructor(@Inject(USER_MANAGEMENT_POOL) private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    await this.migrate();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async migrate(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('USER', 'ADMIN', 'LIBRARIAN')),
        status TEXT NOT NULL CHECK (status IN ('REGISTERED', 'ACTIVE', 'INACTIVE')),
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    `);
  }

  async create(user: User): Promise<User> {
    const result = await this.pool.query<UserRow>(
      `
        INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING ${userColumns}
      `,
      [
        user.id || randomUUID(),
        user.email,
        user.firstName,
        user.lastName,
        user.role,
        user.status,
        user.createdAt,
        user.updatedAt,
      ],
    );

    return mapUserRow(result.rows[0]);
  }

  async update(
    id: string,
    input: CreateUserRequest,
    updatedAt: string,
  ): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `
        UPDATE users
        SET email = $2,
            first_name = $3,
            last_name = $4,
            role = $5,
            status = $6,
            updated_at = $7
        WHERE id = $1
        RETURNING ${userColumns}
      `,
      [
        id,
        input.email,
        input.firstName,
        input.lastName,
        input.role,
        input.status,
        updatedAt,
      ],
    );

    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  async getById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `
        SELECT ${userColumns}
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM users WHERE id = $1", [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
  }
}
