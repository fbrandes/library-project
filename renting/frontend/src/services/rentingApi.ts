import type { Order, OrderInput } from '../types/order';

const API_BASE_URL = (import.meta.env.VITE_RENTING_API_BASE_URL ?? '/api').replace(/\/$/, '');

export interface RentingApi {
  getOrders: () => Promise<Order[]>;
  getOrder: (id: string) => Promise<Order | null>;
  createOrder: (input: OrderInput) => Promise<Order>;
  updateOrder: (id: string, input: OrderInput) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function getErrorMessage(response: Response): string {
  return response.statusText || `Request failed with status ${response.status}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

function jsonRequest(input: OrderInput): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  };
}

export function getOrders(): Promise<Order[]> {
  return fetchJson<Order[]>('/orders');
}

export async function getOrder(id: string): Promise<Order | null> {
  const response = await fetch(buildUrl(`/orders/${encodeURIComponent(id)}`), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response));
  }

  return response.json() as Promise<Order>;
}

export function createOrder(input: OrderInput): Promise<Order> {
  return fetchJson<Order>('/orders', jsonRequest(input));
}

export function updateOrder(id: string, input: OrderInput): Promise<Order> {
  return fetchJson<Order>(`/orders/${encodeURIComponent(id)}`, {
    ...jsonRequest(input),
    method: 'PUT',
  });
}

export async function deleteOrder(id: string): Promise<void> {
  const response = await fetch(buildUrl(`/orders/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response));
  }
}

export const rentingApi: RentingApi = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
};
