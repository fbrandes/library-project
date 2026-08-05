import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createInitialState,
  createRentingStore,
  getCurrentRentedBooks,
  getCurrentRentedOrders,
  getNextState,
  replaceOrder,
  toUserMessage,
} from "./rentingStore";
import type { RentingApi } from "../services/rentingApi";
import { orderFixture } from "../test/fixtures";

describe("rentingStore helpers", () => {
  it("creates initial state", () => {
    expect(createInitialState("user-1")).toMatchObject({
      error: null,
      isLoading: false,
      orders: [],
      selectedOrder: null,
      userId: "user-1",
    });
  });

  it("returns current rented orders and books", () => {
    const active = orderFixture();
    const returned = orderFixture({ id: "returned", state: "RETURNED" });
    const otherUser = orderFixture({ id: "other", userId: "user-2" });

    expect(
      getCurrentRentedOrders([active, returned, otherUser], "user-123"),
    ).toEqual([active]);
    expect(getCurrentRentedBooks([active, returned], "user-123")).toEqual(
      active.contents,
    );
  });

  it("replaces or prepends orders", () => {
    const existing = orderFixture();
    const updated = orderFixture({ state: "PROCESSED" });
    const created = orderFixture({ id: "new" });

    expect(replaceOrder([existing], updated)).toEqual([updated]);
    expect(replaceOrder([existing], created)).toEqual([created, existing]);
  });

  it("maps user-facing errors and state transitions", () => {
    expect(toUserMessage(new Error("Broken"))).toBe("Broken");
    expect(toUserMessage("bad")).toBe("Unable to complete renting request.");
    expect(getNextState("PLACED")).toBe("PROCESSED");
    expect(getNextState("LATE_FOR_RETURN")).toBe("LATE_FOR_RETURN");
  });
});

describe("createRentingStore", () => {
  let api: MockRentingApi;

  beforeEach(() => {
    api = createMockApi();
  });

  it("loads orders", async () => {
    const store = createRentingStore(api);
    api.getOrders.mockResolvedValue([orderFixture()]);

    await store.getState().loadOrders();

    expect(store.getState().orders).toEqual([orderFixture()]);
    expect(store.getState().isLoading).toBe(false);
  });

  it("handles load failures", async () => {
    const store = createRentingStore(api);
    api.getOrders.mockRejectedValue(new Error("Network down"));

    await store.getState().loadOrders();

    expect(store.getState().orders).toEqual([]);
    expect(store.getState().error).toBe("Network down");
  });

  it("loads one order and handles null", async () => {
    const store = createRentingStore(api);
    api.getOrder
      .mockResolvedValueOnce(orderFixture())
      .mockResolvedValueOnce(null);

    await store.getState().loadOrder(orderFixture().id);
    expect(store.getState().selectedOrder).toEqual(orderFixture());

    await store.getState().loadOrder("missing");
    expect(store.getState().selectedOrder).toBeNull();
    expect(store.getState().error).toBe("Order not found.");
  });

  it("creates, updates, and cancels orders", async () => {
    const store = createRentingStore(api);
    const created = orderFixture();
    const updated = orderFixture({ state: "PROCESSED" });
    const input = { userId: "user-123", contents: created.contents };

    api.createOrder.mockResolvedValue(created);
    api.updateOrder.mockResolvedValue(updated);
    api.deleteOrder.mockResolvedValue(undefined);

    await store.getState().rentBooks(input);
    expect(store.getState().orders).toEqual([created]);

    await store.getState().updateOrder(created.id, input);
    expect(store.getState().orders).toEqual([updated]);

    await store.getState().cancelOrder(created.id);
    expect(store.getState().orders).toEqual([]);
  });

  it("keeps existing data when mutations fail", async () => {
    const store = createRentingStore(api);
    store.setState({ orders: [orderFixture()] });
    api.createOrder.mockRejectedValue(new Error("Create failed"));
    api.updateOrder.mockRejectedValue(new Error("Update failed"));
    api.deleteOrder.mockRejectedValue(new Error("Delete failed"));

    await store
      .getState()
      .rentBooks({ userId: "user-123", contents: orderFixture().contents });
    expect(store.getState().error).toBe("Create failed");

    await store.getState().updateOrder(orderFixture().id, {
      userId: "user-123",
      contents: orderFixture().contents,
    });
    expect(store.getState().error).toBe("Update failed");

    await store.getState().cancelOrder(orderFixture().id);
    expect(store.getState().orders).toHaveLength(1);
    expect(store.getState().error).toBe("Delete failed");
  });

  it("sets user id and resets state", () => {
    const store = createRentingStore(api, "initial");

    store.getState().setUserId("next");
    expect(store.getState().userId).toBe("next");

    store.getState().reset();
    expect(store.getState().userId).toBe("initial");
  });

  it("returns current rented books from store state", () => {
    const store = createRentingStore(api);
    store.setState({ orders: [orderFixture()] });

    expect(store.getState().getCurrentRentedBooks()).toEqual(
      orderFixture().contents,
    );
  });
});

type MockRentingApi = {
  [K in keyof RentingApi]: ReturnType<typeof vi.fn>;
};

function createMockApi(): MockRentingApi {
  return {
    getOrders: vi.fn(),
    getOrder: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
    deleteOrder: vi.fn(),
  };
}
