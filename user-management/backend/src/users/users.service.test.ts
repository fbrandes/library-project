import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { CreateUserRequest, User } from "../generated/userModels.js";
import { user, userId, userInput } from "./test-fixtures.js";
import type { UsersRepository } from "./users.repository.js";
import { UsersService } from "./users.service.js";

function repositoryStub(
  overrides: Partial<UsersRepository> = {},
): UsersRepository {
  return {
    create: vi.fn(async (created: User) => created),
    update: vi.fn(
      async (_id: string, input: CreateUserRequest, updatedAt: string) =>
        user({ ...input, updatedAt }),
    ),
    getById: vi.fn(async () => user()),
    delete: vi.fn(async () => true),
    ...overrides,
  };
}

const fixedClock = () => new Date("2026-06-22T12:00:00.000Z");

describe("UsersService", () => {
  it("creates users with generated id and timestamps", async () => {
    const repository = repositoryStub();
    const service = new UsersService(repository, fixedClock);

    const created = await service.create(
      userInput({ email: "ADA@Example.COM" }),
    );

    expect(created.email).toBe("ada@example.com");
    expect(created.id).toMatch(/[0-9a-f-]{36}/);
    expect(created.createdAt).toBe("2026-06-22T12:00:00.000Z");
    expect(repository.create).toHaveBeenCalledWith(created);
  });

  it("rejects invalid create payloads", async () => {
    const service = new UsersService(repositoryStub(), fixedClock);
    await expect(
      service.create({ ...userInput(), email: "" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("gets users by id", async () => {
    const repository = repositoryStub();
    const service = new UsersService(repository, fixedClock);

    await expect(service.getById(` ${userId} `)).resolves.toEqual(user());
    expect(repository.getById).toHaveBeenCalledWith(userId);
  });

  it("rejects blank ids and missing users", async () => {
    const service = new UsersService(
      repositoryStub({ getById: vi.fn(async () => null) }),
      fixedClock,
    );

    await expect(service.getById("")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.getById(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("updates users", async () => {
    const repository = repositoryStub();
    const service = new UsersService(repository, fixedClock);

    const updated = await service.update(
      userId,
      userInput({ status: "INACTIVE" }),
    );

    expect(updated.status).toBe("INACTIVE");
    expect(repository.update).toHaveBeenCalledWith(
      userId,
      userInput({ status: "INACTIVE" }),
      "2026-06-22T12:00:00.000Z",
    );
  });

  it("rejects invalid update inputs and missing users", async () => {
    const service = new UsersService(
      repositoryStub({ update: vi.fn(async () => null) }),
      fixedClock,
    );

    await expect(service.update("", userInput())).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.update(userId, { ...userInput(), role: "OWNER" as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.update(userId, userInput())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("deletes users", async () => {
    const repository = repositoryStub();
    const service = new UsersService(repository, fixedClock);

    await expect(service.delete(userId)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(userId);
  });

  it("rejects invalid delete ids and missing users", async () => {
    const service = new UsersService(
      repositoryStub({ delete: vi.fn(async () => false) }),
      fixedClock,
    );

    await expect(service.delete("")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.delete(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
