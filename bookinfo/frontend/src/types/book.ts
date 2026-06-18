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

export type BookType = 'softcover' | 'hardcover' | 'ebook';

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

export type SearchField = 'isbn' | 'title' | 'author';

export type FilterField = 'title' | 'author';

export type ThemeMode = 'light' | 'dark';

export function getAuthorDisplayName(author: Author): string {
  return [author.firstname, author.middlename, author.lastname]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}
