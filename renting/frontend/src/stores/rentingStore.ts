import { createStore } from 'zustand/vanilla';

import { rentingApi, type RentingApi } from '../services/rentingApi';
import { isActiveRentalState, type Book, type Order, type OrderInput, type OrderState } from '../types/order';

export interface RentingState {
  error: string | null;
  isLoading: boolean;
  orders: Order[];
  selectedOrder: Order | null;
  userId: string;
}

export interface RentingActions {
  cancelOrder: (id: string) => Promise<void>;
  getCurrentRentedBooks: (userId?: string) => Book[];
  loadOrder: (id: string) => Promise<void>;
  loadOrders: () => Promise<void>;
  rentBooks: (input: OrderInput) => Promise<void>;
  reset: (userId?: string) => void;
  setUserId: (userId: string) => void;
  updateOrder: (id: string, input: OrderInput) => Promise<void>;
}

export type RentingStore = RentingState & RentingActions;

export function createInitialState(userId = 'user-123'): RentingState {
  return {
    error: null,
    isLoading: false,
    orders: [],
    selectedOrder: null,
    userId,
  };
}

export function getCurrentRentedOrders(orders: Order[], userId: string): Order[] {
  return orders.filter((order) => order.userId === userId && isActiveRentalState(order.state));
}

export function getCurrentRentedBooks(orders: Order[], userId: string): Book[] {
  return getCurrentRentedOrders(orders, userId).flatMap((order) => order.contents);
}

export function replaceOrder(orders: Order[], order: Order): Order[] {
  const existingIndex = orders.findIndex((candidate) => candidate.id === order.id);
  if (existingIndex === -1) {
    return [order, ...orders];
  }

  return orders.map((candidate) => (candidate.id === order.id ? order : candidate));
}

export function toUserMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unable to complete renting request.';
}

export function createRentingStore(api: RentingApi = rentingApi, initialUserId = 'user-123') {
  return createStore<RentingStore>((set, get) => ({
    ...createInitialState(initialUserId),
    cancelOrder: async (id) => {
      set({ error: null, isLoading: true });
      try {
        await api.deleteOrder(id);
        set(({ orders, selectedOrder }) => ({
          error: null,
          isLoading: false,
          orders: orders.filter((order) => order.id !== id),
          selectedOrder: selectedOrder?.id === id ? null : selectedOrder,
        }));
      } catch (error) {
        set({ error: toUserMessage(error), isLoading: false });
      }
    },
    getCurrentRentedBooks: (userId = get().userId) => getCurrentRentedBooks(get().orders, userId),
    loadOrder: async (id) => {
      set({ error: null, isLoading: true });
      try {
        const selectedOrder = await api.getOrder(id);
        set(({ orders }) => ({
          error: selectedOrder ? null : 'Order not found.',
          isLoading: false,
          orders: selectedOrder ? replaceOrder(orders, selectedOrder) : orders,
          selectedOrder,
        }));
      } catch (error) {
        set({ error: toUserMessage(error), isLoading: false, selectedOrder: null });
      }
    },
    loadOrders: async () => {
      set({ error: null, isLoading: true });
      try {
        const orders = await api.getOrders();
        set({ error: null, isLoading: false, orders });
      } catch (error) {
        set({ error: toUserMessage(error), isLoading: false, orders: [] });
      }
    },
    rentBooks: async (input) => {
      set({ error: null, isLoading: true });
      try {
        const created = await api.createOrder(input);
        set(({ orders }) => ({
          error: null,
          isLoading: false,
          orders: replaceOrder(orders, created),
          selectedOrder: created,
        }));
      } catch (error) {
        set({ error: toUserMessage(error), isLoading: false });
      }
    },
    reset: (userId = initialUserId) => {
      set(createInitialState(userId));
    },
    setUserId: (userId) => {
      set({ userId });
    },
    updateOrder: async (id, input) => {
      set({ error: null, isLoading: true });
      try {
        const updated = await api.updateOrder(id, input);
        set(({ orders }) => ({
          error: null,
          isLoading: false,
          orders: replaceOrder(orders, updated),
          selectedOrder: updated,
        }));
      } catch (error) {
        set({ error: toUserMessage(error), isLoading: false });
      }
    },
  }));
}

export function getNextState(state: OrderState): OrderState {
  const transitions: Partial<Record<OrderState, OrderState>> = {
    PLACED: 'PROCESSED',
    PROCESSED: 'READY_FOR_PICKUP',
    READY_FOR_PICKUP: 'PICKED_UP',
    PICKED_UP: 'RETURNED',
    RETURNED: 'COMPLETED',
  };

  return transitions[state] ?? state;
}

export const rentingStore = createRentingStore();
