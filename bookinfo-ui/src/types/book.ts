export interface Book {
  id?: string;
  isbn: string;
  title: string;
  author: string;
  pages: number;
}

export type SearchField = 'isbn' | 'title' | 'author';

export type FilterField = 'title' | 'author';

export type ThemeMode = 'light' | 'dark';
