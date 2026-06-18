import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { bookApi, type BookApi } from '../services/bookApi';
import { getAuthorDisplayName, type Book, type FilterField, type SearchField, type ThemeMode } from '../types/book';

export interface BookInfoState {
  books: Book[];
  error: string | null;
  filterField: FilterField;
  filterQuery: string;
  isLoading: boolean;
  searchField: SearchField;
  searchQuery: string;
  themeMode: ThemeMode;
}

export interface BookInfoActions {
  getVisibleBooks: () => Book[];
  loadBooks: () => Promise<void>;
  reset: (themeMode?: ThemeMode) => void;
  searchBooks: () => Promise<void>;
  setFilterField: (filterField: FilterField) => void;
  setFilterQuery: (filterQuery: string) => void;
  setSearchField: (searchField: SearchField) => void;
  setSearchQuery: (searchQuery: string) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

export type BookInfoStore = BookInfoState & BookInfoActions;

export function getPreferredThemeMode(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function createInitialState(themeMode: ThemeMode): BookInfoState {
  return {
    books: [],
    error: null,
    filterField: 'title',
    filterQuery: '',
    isLoading: false,
    searchField: 'isbn',
    searchQuery: '',
    themeMode,
  };
}

export function filterBooks(books: Book[], field: SearchField | FilterField, query: string): Book[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return books;
  }

  return books.filter((book) =>
    getSearchableBookValue(book, field).toLocaleLowerCase().includes(normalizedQuery),
  );
}

function getSearchableBookValue(book: Book, field: SearchField | FilterField): string {
  if (field === 'author') {
    return getAuthorDisplayName(book.author);
  }

  return book[field];
}

function toUserMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to fetch books.';
}

export function createBookInfoStore(
  api: BookApi = bookApi,
  initialThemeMode: ThemeMode = getPreferredThemeMode(),
) {
  return createStore<BookInfoStore>((set, get) => ({
    ...createInitialState(initialThemeMode),
    getVisibleBooks: () => {
      const { books, filterField, filterQuery } = get();
      return filterBooks(books, filterField, filterQuery);
    },
    loadBooks: async () => {
      set({ error: null, isLoading: true });

      try {
        const books = await api.getBooks();
        set({ books, error: null, isLoading: false });
      } catch (error) {
        set({ books: [], error: toUserMessage(error), isLoading: false });
      }
    },
    reset: (themeMode = initialThemeMode) => {
      set(createInitialState(themeMode));
    },
    searchBooks: async () => {
      const { searchField, searchQuery } = get();
      const query = searchQuery.trim();

      set({ error: null, filterQuery: '', isLoading: true });

      try {
        if (!query) {
          const books = await api.getBooks();
          set({ books, error: null, isLoading: false });
          return;
        }

        if (searchField === 'isbn') {
          const book = await api.getBookByIsbn(query);
          set({ books: book ? [book] : [], error: null, isLoading: false });
          return;
        }

        const books = await api.getBooks();
        set({
          books: filterBooks(books, searchField, query),
          error: null,
          isLoading: false,
        });
      } catch (error) {
        set({ books: [], error: toUserMessage(error), isLoading: false });
      }
    },
    setFilterField: (filterField) => {
      set({ filterField });
    },
    setFilterQuery: (filterQuery) => {
      set({ filterQuery });
    },
    setSearchField: (searchField) => {
      set({ searchField });
    },
    setSearchQuery: (searchQuery) => {
      set({ searchQuery });
    },
    setThemeMode: (themeMode) => {
      set({ themeMode });
    },
    toggleThemeMode: () => {
      set(({ themeMode }) => ({
        themeMode: themeMode === 'dark' ? 'light' : 'dark',
      }));
    },
  }));
}

export const bookInfoStore = createBookInfoStore();

export function useBookInfoStore<T>(selector: (state: BookInfoStore) => T): T {
  return useStore(bookInfoStore, selector);
}
