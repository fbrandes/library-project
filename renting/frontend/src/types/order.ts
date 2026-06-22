export type BookType = 'SOFTCOVER' | 'HARDCOVER' | 'EBOOK';

export interface Address {
  street: string;
  zipCode: string;
  city: string;
}

export interface Publisher {
  name: string;
  address: Address;
}

export interface Author {
  firstname: string;
  middlename: string;
  lastname: string;
  bio: string;
}

export interface Book {
  id?: string;
  isbn: string;
  title: string;
  author: Author;
  pages: number;
  publisher: Publisher;
  genres: string[];
  language: string;
  summary: string;
  publicationDate: string;
  edition: number;
  type: BookType;
}

export const orderStates = [
  'PLACED',
  'PROCESSED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'RETURNED',
  'COMPLETED',
  'LATE_FOR_RETURN',
] as const;

export type OrderState = (typeof orderStates)[number];

export interface Order {
  id: string;
  userId: string;
  placedAt: string;
  contents: Book[];
  rentEndsAt: string;
  state: OrderState;
}

export interface OrderInput {
  userId: string;
  contents: Book[];
  state?: OrderState;
}

export function isOrderState(value: string): value is OrderState {
  return orderStates.includes(value as OrderState);
}

export function isActiveRentalState(state: OrderState): boolean {
  return state !== 'RETURNED' && state !== 'COMPLETED';
}

export function countBooks(order: Pick<Order, 'contents'>): number {
  return order.contents.length;
}
