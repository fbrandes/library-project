import { describe, expect, it, vi } from "vitest";
import { ApiError, createUsersApi, type Fetcher } from "./usersApi";
import { user, userId, userInput } from "../test/fixtures";

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(
    init.status === 204 ? null : body === undefined ? "" : JSON.stringify(body),
    {
      status: init.status ?? 200,
      headers: { "Content-Type": "application/json" },
      ...init,
    },
  );
}

describe("usersApi", () => {
  it("creates users with JSON payloads", async () => {
    const fetcher = vi.fn(async () => response(user())) as unknown as Fetcher;
    const api = createUsersApi("/users-api", fetcher);

    await expect(api.createUser(userInput())).resolves.toEqual(user());

    expect(fetcher).toHaveBeenCalledWith("/users-api/users", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userInput()),
    });
  });

  it("gets, updates, and deletes users", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(user()))
      .mockResolvedValueOnce(response(user({ status: "INACTIVE" })))
      .mockResolvedValueOnce(
        response(undefined, { status: 204 }),
      ) as unknown as Fetcher;
    const api = createUsersApi("/api", fetcher);

    await expect(api.getUser(userId)).resolves.toEqual(user());
    await expect(
      api.updateUser(userId, userInput({ status: "INACTIVE" })),
    ).resolves.toMatchObject({
      status: "INACTIVE",
    });
    await expect(api.deleteUser(userId)).resolves.toBeUndefined();

    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `/api/users/${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
    );
    expect(fetcher).toHaveBeenNthCalledWith(
      3,
      `/api/users/${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      },
    );
  });

  it("throws API errors with response details", async () => {
    const fetcher = vi.fn(async () =>
      response(
        { message: "Invalid user payload", problems: ["email is required"] },
        { status: 400 },
      ),
    ) as unknown as Fetcher;
    const api = createUsersApi("/api", fetcher);

    await expect(api.createUser(userInput())).rejects.toMatchObject({
      status: 400,
      message: "Invalid user payload: email is required",
    });
  });

  it("throws fallback API errors for empty error responses", async () => {
    const fetcher = vi.fn(async () =>
      response(undefined, { status: 500 }),
    ) as unknown as Fetcher;
    const api = createUsersApi("/api", fetcher);

    await expect(api.getUser(userId)).rejects.toBeInstanceOf(ApiError);
    await expect(api.getUser(userId)).rejects.toThrow(
      "Request failed with status 500",
    );
  });
});
