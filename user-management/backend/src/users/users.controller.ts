import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "../generated/userModels.js";
import { UsersService } from "./users.service.js";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() input: CreateUserRequest): Promise<User> {
    return this.users.create(input);
  }

  @Get(":id")
  getById(@Param("id") id: string): Promise<User> {
    return this.users.getById(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() input: UpdateUserRequest,
  ): Promise<User> {
    return this.users.update(id, input);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param("id") id: string): Promise<void> {
    return this.users.delete(id);
  }
}
