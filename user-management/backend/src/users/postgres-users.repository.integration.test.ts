import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { user, userId, userInput } from "./test-fixtures.js";
import { PostgresUsersRepository } from "./postgres-users.repository.js";

describe.skipIf(process.env.USER_MANAGEMENT_TESTCONTAINERS !== "true")(
  "PostgresUsersRepository integration",
  () => {
    it("persists a user lifecycle with Testcontainers", async () => {
      const container = await new PostgreSqlContainer("postgres:16-alpine")
        .withDatabase("user_management")
        .withUsername("user_management")
        .withPassword("user_management")
        .start();

      const pool = new Pool({ connectionString: container.getConnectionUri() });
      const repository = new PostgresUsersRepository(pool);

      try {
        await repository.migrate();
        const created = await repository.create(user());
        expect(created.id).toBe(userId);

        const fetched = await repository.getById(userId);
        expect(fetched).toEqual(created);

        const updated = await repository.update(
          userId,
          userInput({ status: "INACTIVE" }),
          new Date().toISOString(),
        );
        expect(updated?.status).toBe("INACTIVE");

        await expect(repository.delete(userId)).resolves.toBe(true);
        await expect(repository.getById(userId)).resolves.toBeNull();
      } finally {
        await pool.end();
        await container.stop();
      }
    });
  },
);
