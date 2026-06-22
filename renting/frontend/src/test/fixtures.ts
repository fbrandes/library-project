import type { Book, Order } from '../types/order';

export function bookFixture(overrides: Partial<Book> = {}): Book {
  return {
    isbn: '9780134685991',
    title: 'Effective Go Services',
    author: {
      firstname: 'Ada',
      middlename: '',
      lastname: 'Lovelace',
      bio: 'Computer pioneer.',
    },
    pages: 300,
    publisher: {
      name: 'Engineering Press',
      address: {
        street: 'Main Street 1',
        zipCode: '02116',
        city: 'Boston',
      },
    },
    genres: ['Programming'],
    language: 'English',
    summary: 'A practical book.',
    publicationDate: '2026-01-01',
    edition: 1,
    type: 'HARDCOVER',
    ...overrides,
  };
}

export function orderFixture(overrides: Partial<Order> = {}): Order {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'user-123',
    placedAt: '2026-06-22T09:00:00Z',
    contents: [bookFixture()],
    rentEndsAt: '2026-07-06T09:00:00Z',
    state: 'PLACED',
    ...overrides,
  };
}
