import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  createOrder,
  deleteOrder,
  getOrder,
  getOrders,
  updateOrder,
} from "./rentingApi";
import { orderFixture } from "../test/fixtures";

describe("rentingApi", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("gets all orders", async () => {
    fetchMock.mockResolvedValue(jsonResponse([orderFixture()]));

    await expect(getOrders()).resolves.toEqual([orderFixture()]);

    expect(fetchMock).toHaveBeenCalledWith("/api/orders", {
      headers: {
        Accept: "application/json",
      },
    });
  });

  it("gets a single order and maps 404 to null", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(orderFixture()));
    await expect(getOrder("order 1")).resolves.toEqual(orderFixture());
    expect(fetchMock).toHaveBeenCalledWith("/api/orders/order%201", {
      headers: {
        Accept: "application/json",
      },
    });

    fetchMock.mockResolvedValueOnce(
      new Response("", { status: 404, statusText: "Not Found" }),
    );
    await expect(getOrder("missing")).resolves.toBeNull();
  });

  it("creates and updates orders with JSON payloads", async () => {
    const input = {
      userId: "user-123",
      contents: orderFixture().contents,
      state: "PLACED" as const,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(orderFixture()));
    fetchMock.mockResolvedValueOnce(
      jsonResponse(orderFixture({ state: "PROCESSED" })),
    );

    await createOrder(input);
    await updateOrder("order-1", input);

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/orders", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/orders/order-1", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  });

  it("deletes orders", async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 204, statusText: "No Content" }),
    );

    await expect(deleteOrder("order-1")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith("/api/orders/order-1", {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
  });

  it("throws ApiError for failed responses", async () => {
    fetchMock.mockResolvedValue(
      new Response("", { status: 500, statusText: "Broken" }),
    );

    await expect(getOrders()).rejects.toMatchObject(
      new ApiError(500, "Broken"),
    );
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
