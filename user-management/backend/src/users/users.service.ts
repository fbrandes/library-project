import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "../generated/userModels.js";
import { UserNotFoundError } from "./user.errors.js";
import {
  normalizeUserInput,
  validateUserId,
  validateUserInput,
} from "./user.validation.js";
import { USERS_REPOSITORY, type UsersRepository } from "./users.repository.js";

export type Clock = () => Date;
export const USER_MANAGEMENT_CLOCK = Symbol("USER_MANAGEMENT_CLOCK");

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly repository: UsersRepository,
    @Optional()
    @Inject(USER_MANAGEMENT_CLOCK)
    private readonly clock: Clock = () => new Date(),
  ) {}

  async create(input: CreateUserRequest): Promise<User> {
    const normalized = this.parseInput(input);
    const now = this.clock().toISOString();
    return this.repository.create({
      id: randomUUID(),
      ...normalized,
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id: string, input: UpdateUserRequest): Promise<User> {
    const userId = this.parseId(id);
    const normalized = this.parseInput(input);
    const updated = await this.repository.update(
      userId,
      normalized,
      this.clock().toISOString(),
    );
    if (!updated) {
      throw this.notFound(userId);
    }
    return updated;
  }

  async getById(id: string): Promise<User> {
    const userId = this.parseId(id);
    const user = await this.repository.getById(userId);
    if (!user) {
      throw this.notFound(userId);
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    const userId = this.parseId(id);
    const deleted = await this.repository.delete(userId);
    if (!deleted) {
      throw this.notFound(userId);
    }
  }

  private parseInput(
    input: CreateUserRequest | UpdateUserRequest,
  ): CreateUserRequest {
    const problems = validateUserInput(input);
    if (problems.length > 0) {
      throw new BadRequestException({
        message: "Invalid user payload",
        problems,
      });
    }
    return normalizeUserInput(input);
  }

  private parseId(id: string): string {
    const normalized = id.trim();
    const problems = validateUserId(normalized);
    if (problems.length > 0) {
      throw new BadRequestException({
        message: "Invalid user id",
        problems,
      });
    }
    return normalized;
  }

  private notFound(id: string): NotFoundException {
    const error = new UserNotFoundError(id);
    return new NotFoundException({ message: error.message });
  }
}
