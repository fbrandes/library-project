import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import {
  createdAt,
  updatedAt,
  user,
  userId,
  userInput,
} from "./test-fixtures.js";
import {
  mapUserRow,
  PostgresUsersRepository,
  toIsoString,
} from "./postgres-users.repository.js";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: userId,
    email: "ada@example.com",
    first_name: "Ada",
    last_name: "Lovelace",
    role: "LIBRARIAN",
    status: "ACTIVE",
    created_at: new Date(createdAt),
    updated_at: new Date(updatedAt),
    ...overrides,
  };
}

function poolStub(results: unknown[] = []) {
  const query = vi.fn(async () => results.shift() ?? { rows: [], rowCount: 0 });
  const end = vi.fn(async () => undefined);
  return { pool: { query, end } as unknown as Pool, query, end };
}

describe("PostgresUsersRepository", () => {
  it("maps rows and string dates", () => {
    expect(toIsoString(createdAt)).toBe(createdAt);
    expect(
      mapUserRow(row({ created_at: createdAt, updated_at: updatedAt })),
    ).toEqual(user());
  });

  it("migrates on module init and closes on destroy", async () => {
    const { pool, query, end } = poolStub([{ rows: [] }]);
    const repository = new PostgresUsersRepository(pool);

    await repository.onModuleInit();
    await repository.onModuleDestroy();

    expect(query.mock.calls[0][0]).toContain(
      "CREATE TABLE IF NOT EXISTS users",
    );
    expect(end).toHaveBeenCalled();
  });

  it("creates users", async () => {
    const { pool, query } = poolStub([{ rows: [row()] }]);
    const repository = new PostgresUsersRepository(pool);

    await expect(repository.create(user())).resolves.toEqual(user());

    expect(query.mock.calls[0][0]).toContain("INSERT INTO users");
    expect(query.mock.calls[0][1]).toEqual([
      userId,
      "ada@example.com",
      "Ada",
      "Lovelace",
      "LIBRARIAN",
      "ACTIVE",
      createdAt,
      updatedAt,
    ]);
  });

  it("generates an id if create receives an empty id", async () => {
    const { pool, query } = poolStub([{ rows: [row()] }]);
    const repository = new PostgresUsersRepository(pool);

    await repository.create(user({ id: "" }));

    expect(String(query.mock.calls[0][1][0])).toMatch(/[0-9a-f-]{36}/);
  });

  it("updates users and returns null when no row is updated", async () => {
    const { pool, query } = poolStub([
      { rows: [row({ status: "INACTIVE" })] },
      { rows: [] },
    ]);
    const repository = new PostgresUsersRepository(pool);

    await expect(
      repository.update(userId, userInput({ status: "INACTIVE" }), updatedAt),
    ).resolves.toMatchObject({
      status: "INACTIVE",
    });
    await expect(
      repository.update(userId, userInput(), updatedAt),
    ).resolves.toBeNull();

    expect(query.mock.calls[0][0]).toContain("UPDATE users");
  });

  it("gets users by id and returns null when missing", async () => {
    const { pool, query } = poolStub([{ rows: [row()] }, { rows: [] }]);
    const repository = new PostgresUsersRepository(pool);

    await expect(repository.getById(userId)).resolves.toEqual(user());
    await expect(repository.getById(userId)).resolves.toBeNull();

    expect(query.mock.calls[0][0]).toContain("SELECT");
    expect(query.mock.calls[0][1]).toEqual([userId]);
  });

  it("deletes users", async () => {
    const { pool, query } = poolStub([{ rowCount: 1 }, { rowCount: 0 }, {}]);
    const repository = new PostgresUsersRepository(pool);

    await expect(repository.delete(userId)).resolves.toBe(true);
    await expect(repository.delete(userId)).resolves.toBe(false);
    await expect(repository.delete(userId)).resolves.toBe(false);

    expect(query.mock.calls[0][0]).toContain("DELETE FROM users");
    expect(query.mock.calls[0][1]).toEqual([userId]);
  });
});
