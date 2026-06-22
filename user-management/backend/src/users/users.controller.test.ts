import { describe, expect, it, vi } from 'vitest';
import { user, userId, userInput } from './test-fixtures.js';
import { UsersController } from './users.controller.js';
import type { UsersService } from './users.service.js';

function serviceStub(): UsersService {
  return {
    create: vi.fn(async () => user()),
    getById: vi.fn(async () => user()),
    update: vi.fn(async () => user({ status: 'INACTIVE' })),
    delete: vi.fn(async () => undefined),
  } as unknown as UsersService;
}

describe('UsersController', () => {
  it('delegates create, get, update, and delete to the service', async () => {
    const service = serviceStub();
    const controller = new UsersController(service);

    await expect(controller.create(userInput())).resolves.toEqual(user());
    await expect(controller.getById(userId)).resolves.toEqual(user());
    await expect(controller.update(userId, userInput({ status: 'INACTIVE' }))).resolves.toMatchObject({
      status: 'INACTIVE',
    });
    await expect(controller.delete(userId)).resolves.toBeUndefined();

    expect(service.create).toHaveBeenCalledWith(userInput());
    expect(service.getById).toHaveBeenCalledWith(userId);
    expect(service.update).toHaveBeenCalledWith(userId, userInput({ status: 'INACTIVE' }));
    expect(service.delete).toHaveBeenCalledWith(userId);
  });
});
