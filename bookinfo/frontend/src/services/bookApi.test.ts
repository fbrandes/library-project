import { describe, expect, it, vi } from 'vitest';

import { domainDrivenDesign, effectiveJava } from '../test/bookFixtures';
import { ApiError, getBookByIsbn, getBooks } from './bookApi';

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
    ...init,
  });
}

describe('bookApi', () => {
  it('fetches all books', async () => {
    const books = [effectiveJava];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(books));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getBooks()).resolves.toEqual(books);

    expect(fetchMock).toHaveBeenCalledWith('/api/books', {
      headers: {
        Accept: 'application/json',
      },
    });
  });

  it('fetches a book by ISBN', async () => {
    const book = domainDrivenDesign;
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(book));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getBookByIsbn('9780321125217')).resolves.toEqual(book);

    expect(fetchMock).toHaveBeenCalledWith('/api/books/9780321125217', {
      headers: {
        Accept: 'application/json',
      },
    });
  });

  it('returns null when ISBN lookup receives 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(getBookByIsbn('missing-isbn')).resolves.toBeNull();
  });

  it('throws ApiError for failed responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    await expect(getBooks()).rejects.toBeInstanceOf(ApiError);
    await expect(getBooks()).rejects.toMatchObject({ status: 500 });
  });
});
