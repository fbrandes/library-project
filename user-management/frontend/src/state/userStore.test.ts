import { describe, expect, it, vi } from 'vitest';
import { applyUserToDraft, createUserStore, emptyUserDraft, roleOptions, statusOptions, toUserRequest } from './userStore';
import { user, userId, userInput } from '../test/fixtures';
import type { UsersApi } from '../api/usersApi';

function apiStub(overrides: Partial<UsersApi> = {}): UsersApi {
  return {
    createUser: vi.fn(async () => user()),
    getUser: vi.fn(async () => user()),
    updateUser: vi.fn(async (_id, input) => user(input)),
    deleteUser: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('userStore helpers', () => {
  it('creates and trims drafts', () => {
    expect(emptyUserDraft()).toEqual({
      email: '',
      firstName: '',
      lastName: '',
      role: 'USER',
      status: 'REGISTERED',
    });
    expect(
      toUserRequest({
        email: ' ada@example.com ',
        firstName: ' Ada ',
        lastName: ' Lovelace ',
        role: 'ADMIN',
        status: 'ACTIVE',
      }),
    ).toEqual(userInput({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace', role: 'ADMIN' }));
  });

  it('applies users to drafts and exposes options', () => {
    const draft = emptyUserDraft();
    applyUserToDraft(user(), draft);

    expect(draft).toEqual(userInput());
    expect(roleOptions).toEqual(['USER', 'ADMIN', 'LIBRARIAN']);
    expect(statusOptions).toEqual(['REGISTERED', 'ACTIVE', 'INACTIVE']);
  });
});

describe('createUserStore', () => {
  it('updates draft and lookup fields', () => {
    const store = createUserStore(apiStub());

    store.setDraftField('email', 'ada@example.com');
    store.setLookupId(userId);

    expect(store.state.draft.email).toBe('ada@example.com');
    expect(store.state.lookupId).toBe(userId);
  });

  it('creates users and stores returned user', async () => {
    const api = apiStub();
    const store = createUserStore(api);
    store.setDraftField('email', ' ada@example.com ');
    store.setDraftField('firstName', 'Ada');
    store.setDraftField('lastName', 'Lovelace');
    store.setDraftField('role', 'LIBRARIAN');
    store.setDraftField('status', 'ACTIVE');

    await expect(store.create()).resolves.toEqual(user());

    expect(api.createUser).toHaveBeenCalledWith(userInput());
    expect(store.state.currentUser).toEqual(user());
    expect(store.state.lookupId).toBe(userId);
    expect(store.state.message).toBe('User created');
    expect(store.state.loading).toBe(false);
  });

  it('loads users and updates the draft', async () => {
    const api = apiStub();
    const store = createUserStore(api);
    store.setLookupId(` ${userId} `);

    await store.load();

    expect(api.getUser).toHaveBeenCalledWith(userId);
    expect(store.state.draft).toEqual(userInput());
    expect(store.state.message).toBe('User loaded');
  });

  it('updates users', async () => {
    const api = apiStub();
    const store = createUserStore(api);
    store.setLookupId(userId);
    applyUserToDraft(user({ status: 'INACTIVE' }), store.state.draft);

    await store.update();

    expect(api.updateUser).toHaveBeenCalledWith(userId, userInput({ status: 'INACTIVE' }));
    expect(store.state.message).toBe('User updated');
  });

  it('deletes users and resets state', async () => {
    const api = apiStub();
    const store = createUserStore(api);
    store.state.currentUser = user();
    store.setLookupId(userId);

    await store.delete();

    expect(api.deleteUser).toHaveBeenCalledWith(userId);
    expect(store.state.currentUser).toBeNull();
    expect(store.state.lookupId).toBe('');
    expect(store.state.draft).toEqual(emptyUserDraft());
    expect(store.state.message).toBe('User deleted');
  });

  it('captures action errors', async () => {
    const api = apiStub({
      createUser: vi.fn(async () => {
        throw new Error('create failed');
      }),
      deleteUser: vi.fn(async () => {
        throw 'delete failed';
      }),
    });
    const store = createUserStore(api);

    await expect(store.create()).resolves.toBeNull();
    expect(store.state.error).toBe('create failed');

    await expect(store.delete()).resolves.toBeNull();
    expect(store.state.error).toBe('Unexpected error');
    expect(store.state.loading).toBe(false);
  });
});
