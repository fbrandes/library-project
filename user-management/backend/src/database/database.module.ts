import { Module } from "@nestjs/common";
import { Pool } from "pg";

export const USER_MANAGEMENT_POOL = Symbol("USER_MANAGEMENT_POOL");

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (
    env.USER_MANAGEMENT_DATABASE_URL ??
    "postgres://user_management:user_management@localhost:5434/user_management"
  );
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
