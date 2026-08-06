import { Module } from "@nestjs/common";
import { Pool } from "pg";

export const USER_MANAGEMENT_POOL = Symbol("USER_MANAGEMENT_POOL");

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.USER_MANAGEMENT_DATABASE_URL) {
    return env.USER_MANAGEMENT_DATABASE_URL;
  }

  const databaseUrl = new URL("postgres://localhost");
  databaseUrl.hostname = env.USER_MANAGEMENT_DATABASE_HOST ?? "localhost";
  databaseUrl.port = env.USER_MANAGEMENT_DATABASE_PORT ?? "5434";
  databaseUrl.username = env.USER_MANAGEMENT_DATABASE_USER ?? "user_management";
  databaseUrl.password =
    env.USER_MANAGEMENT_DATABASE_PASSWORD ?? "user_management";
  databaseUrl.pathname = env.USER_MANAGEMENT_DATABASE_NAME ?? "user_management";
  return databaseUrl.toString();
}

export const poolProvider = {
  provide: USER_MANAGEMENT_POOL,
  useFactory: () => new Pool({ connectionString: getDatabaseUrl() }),
};

@Module({
  providers: [poolProvider],
  exports: [poolProvider],
})
export class DatabaseModule {}
