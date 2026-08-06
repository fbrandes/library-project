import { describe, expect, it } from "vitest";
import {
  DatabaseModule,
  getDatabaseUrl,
  poolProvider,
} from "./database.module.js";

describe("getDatabaseUrl", () => {
  it("returns configured database url", () => {
    expect(
      getDatabaseUrl({ USER_MANAGEMENT_DATABASE_URL: "postgres://example" }),
    ).toBe("postgres://example");
  });

  it("returns local default when no url is configured", () => {
    expect(getDatabaseUrl({})).toContain("localhost:5434/user_management");
  });

  it("builds the database url from individual settings", () => {
    expect(
      getDatabaseUrl({
        USER_MANAGEMENT_DATABASE_HOST: "postgres",
        USER_MANAGEMENT_DATABASE_PORT: "5432",
        USER_MANAGEMENT_DATABASE_NAME: "library",
        USER_MANAGEMENT_DATABASE_USER: "app-user",
        USER_MANAGEMENT_DATABASE_PASSWORD: "password with spaces",
      }),
    ).toBe("postgres://app-user:password%20with%20spaces@postgres:5432/library");
  });

  it("exports the database module and creates a pool provider", async () => {
    expect(DatabaseModule).toBeDefined();
    const pool = poolProvider.useFactory();
    expect(pool).toBeDefined();
    await pool.end();
  });
});
