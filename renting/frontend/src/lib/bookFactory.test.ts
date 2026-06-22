import { describe, expect, it } from 'vitest';

import { createBookFromInput, normalizeIsbn } from './bookFactory';

describe('bookFactory', () => {
  it('normalizes ISBN input', () => {
    expect(normalizeIsbn(' 9780134685991 ')).toBe('9780134685991');
  });

  it('creates a book payload that matches the renting API model', () => {
    const book = createBookFromInput(' 9780134685991 ', ' Effective Go Services ');

    expect(book.isbn).toBe('9780134685991');
    expect(book.title).toBe('Effective Go Services');
    expect(book.author.firstname).toBe('Unknown');
    expect(book.pages).toBe(1);
    expect(book.publisher.address.city).toBe('Unknown City');
    expect(book.publicationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('uses a fallback title when none is supplied', () => {
    expect(createBookFromInput('isbn-1', ' ').title).toBe('Rental isbn-1');
  });
});
