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

  it("exports the database module and creates a pool provider", async () => {
    expect(DatabaseModule).toBeDefined();
    const pool = poolProvider.useFactory();
    expect(pool).toBeDefined();
    await pool.end();
  });
});
