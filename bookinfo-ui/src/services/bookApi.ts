import type { Book } from '../types/book';

const API_BASE_URL = (import.meta.env.VITE_BOOKINFO_API_BASE_URL ?? '/api').replace(/\/$/, '');

export interface BookApi {
  getBooks: () => Promise<Book[]>;
  getBookByIsbn: (isbn: string) => Promise<Book | null>;
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

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export async function getBooks(): Promise<Book[]> {
  return fetchJson<Book[]>('/books');
}

export async function getBookByIsbn(isbn: string): Promise<Book | null> {
  const response = await fetch(buildUrl(`/books/${encodeURIComponent(isbn)}`), {
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

  return response.json() as Promise<Book>;
}

export const bookApi: BookApi = {
  getBooks,
  getBookByIsbn,
};
