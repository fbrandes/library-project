import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { PostgresUsersRepository } from "./postgres-users.repository.js";
import { UsersController } from "./users.controller.js";
import { USERS_REPOSITORY } from "./users.repository.js";
import { USER_MANAGEMENT_CLOCK, UsersService } from "./users.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    PostgresUsersRepository,
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useExisting: PostgresUsersRepository,
    },
    {
      provide: USER_MANAGEMENT_CLOCK,
      useValue: () => new Date(),
    },
  ],
})
export class UsersModule {}
