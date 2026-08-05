import { reactive } from "vue";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserRole,
  UserStatus,
} from "../generated/userModels";
import { createUsersApi, type UsersApi } from "../api/usersApi";

export type UserDraft = CreateUserRequest;

export interface UserState {
  currentUser: User | null;
  draft: UserDraft;
  lookupId: string;
  loading: boolean;
  error: string;
  message: string;
}

export function emptyUserDraft(): UserDraft {
  return {
    email: "",
    firstName: "",
    lastName: "",
    role: "USER",
    status: "REGISTERED",
  };
}

export function toUserRequest(draft: UserDraft): CreateUserRequest {
  return {
    email: draft.email.trim(),
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    role: draft.role,
    status: draft.status,
  };
}

export function applyUserToDraft(user: User, draft: UserDraft): void {
  draft.email = user.email;
  draft.firstName = user.firstName;
  draft.lastName = user.lastName;
  draft.role = user.role;
  draft.status = user.status;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

export function createUserStore(api: UsersApi = createUsersApi()) {
  const state = reactive<UserState>({
    currentUser: null,
    draft: emptyUserDraft(),
    lookupId: "",
    loading: false,
    error: "",
    message: "",
  });

  async function run(
    action: () => Promise<User | null>,
    successMessage: string,
  ): Promise<User | null> {
    state.loading = true;
    state.error = "";
    state.message = "";
    try {
      const user = await action();
      state.currentUser = user;
      state.message = successMessage;
      return user;
    } catch (error) {
      state.error = errorMessage(error);
      return null;
    } finally {
      state.loading = false;
    }
  }

  return {
    state,

    setDraftField<K extends keyof UserDraft>(
      field: K,
      value: UserDraft[K],
    ): void {
      state.draft[field] = value;
    },

    setLookupId(value: string): void {
      state.lookupId = value;
    },

    async create(): Promise<User | null> {
      return run(async () => {
        const user = await api.createUser(toUserRequest(state.draft));
        applyUserToDraft(user, state.draft);
        state.lookupId = user.id;
        return user;
      }, "User created");
    },

    async load(): Promise<User | null> {
      return run(async () => {
        const user = await api.getUser(state.lookupId.trim());
        applyUserToDraft(user, state.draft);
        return user;
      }, "User loaded");
    },

    async update(): Promise<User | null> {
      return run(async () => {
        const user = await api.updateUser(
          state.lookupId.trim(),
          toUserRequest(state.draft) as UpdateUserRequest,
        );
        applyUserToDraft(user, state.draft);
        return user;
      }, "User updated");
    },

    async delete(): Promise<User | null> {
      state.loading = true;
      state.error = "";
      state.message = "";
      try {
        await api.deleteUser(state.lookupId.trim());
        state.currentUser = null;
        state.draft = emptyUserDraft();
        state.lookupId = "";
        state.message = "User deleted";
        return null;
      } catch (error) {
        state.error = errorMessage(error);
        return null;
      } finally {
        state.loading = false;
      }
    },
  };
}

export const roleOptions: UserRole[] = ["USER", "ADMIN", "LIBRARIAN"];
export const statusOptions: UserStatus[] = ["REGISTERED", "ACTIVE", "INACTIVE"];

export type UserStore = ReturnType<typeof createUserStore>;
