import { describe, expect, it, vi } from 'vitest';

import type { BookApi } from '../services/bookApi';
import type { Book } from '../types/book';
import { domainDrivenDesign, effectiveJava } from '../test/bookFixtures';
import { createBookInfoStore, filterBooks, getPreferredThemeMode } from './bookInfoStore';

const books: Book[] = [effectiveJava, domainDrivenDesign];

function createMockApi(): BookApi {
  return {
    getBookByIsbn: vi.fn(),
    getBooks: vi.fn(),
  };
}

describe('bookInfoStore', () => {
  it('loads all books', async () => {
    const api = createMockApi();
    vi.mocked(api.getBooks).mockResolvedValue(books);
    const store = createBookInfoStore(api, 'light');

    await store.getState().loadBooks();

    expect(api.getBooks).toHaveBeenCalledTimes(1);
    expect(store.getState().books).toEqual(books);
    expect(store.getState().isLoading).toBe(false);
    expect(store.getState().error).toBeNull();
  });

  it('searches by ISBN through the ISBN endpoint', async () => {
    const api = createMockApi();
    vi.mocked(api.getBookByIsbn).mockResolvedValue(books[0]);
    const store = createBookInfoStore(api, 'light');

    store.getState().setSearchField('isbn');
    store.getState().setSearchQuery(' 9780134685991 ');
    await store.getState().searchBooks();

    expect(api.getBookByIsbn).toHaveBeenCalledWith('9780134685991');
    expect(api.getBooks).not.toHaveBeenCalled();
    expect(store.getState().books).toEqual([books[0]]);
  });

  it('stores an empty list when ISBN lookup has no match', async () => {
    const api = createMockApi();
    vi.mocked(api.getBookByIsbn).mockResolvedValue(null);
    const store = createBookInfoStore(api, 'light');

    store.getState().setSearchField('isbn');
    store.getState().setSearchQuery('missing-isbn');
    await store.getState().searchBooks();

    expect(store.getState().books).toEqual([]);
  });

  it('searches title and author locally after fetching all books', async () => {
    const api = createMockApi();
    vi.mocked(api.getBooks).mockResolvedValue(books);
    const store = createBookInfoStore(api, 'light');

    store.getState().setSearchField('author');
    store.getState().setSearchQuery('evans');
    await store.getState().searchBooks();

    expect(api.getBooks).toHaveBeenCalledTimes(1);
    expect(store.getState().books).toEqual([books[1]]);
  });

  it('uses all books for an empty search query', async () => {
    const api = createMockApi();
    vi.mocked(api.getBooks).mockResolvedValue(books);
    const store = createBookInfoStore(api, 'light');

    store.getState().setSearchField('isbn');
    store.getState().setSearchQuery(' ');
    await store.getState().searchBooks();

    expect(api.getBooks).toHaveBeenCalledTimes(1);
    expect(api.getBookByIsbn).not.toHaveBeenCalled();
    expect(store.getState().books).toEqual(books);
  });

  it('derives visible books from the secondary filter', () => {
    const store = createBookInfoStore(createMockApi(), 'light');

    store.setState({ books, filterField: 'title', filterQuery: 'domain' });

    expect(store.getState().getVisibleBooks()).toEqual([books[1]]);
  });

  it('sets an error when loading fails', async () => {
    const api = createMockApi();
    vi.mocked(api.getBooks).mockRejectedValue(new Error('Backend unavailable'));
    const store = createBookInfoStore(api, 'light');

    await store.getState().loadBooks();

    expect(store.getState().books).toEqual([]);
    expect(store.getState().error).toBe('Backend unavailable');
  });

  it('toggles the theme mode', () => {
    const store = createBookInfoStore(createMockApi(), 'light');

    store.getState().toggleThemeMode();

    expect(store.getState().themeMode).toBe('dark');
  });
});

describe('filterBooks', () => {
  it('matches fields case-insensitively', () => {
    expect(filterBooks(books, 'author', 'BLOCH')).toEqual([books[0]]);
  });
});

describe('getPreferredThemeMode', () => {
  it('uses the browser dark-mode preference', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    });

    expect(getPreferredThemeMode()).toBe('dark');
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});
