import type { CreateUserRequest, User } from "../generated/userModels.js";

export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");

export interface UsersRepository {
  create(user: User): Promise<User>;
  update(
    id: string,
    input: CreateUserRequest,
    updatedAt: string,
  ): Promise<User | null>;
  getById(id: string): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
