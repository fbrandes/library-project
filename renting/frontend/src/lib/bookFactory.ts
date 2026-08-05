import type { Book } from "../types/order";

export function normalizeIsbn(isbn: string): string {
  return isbn.trim();
}

export function createBookFromInput(isbn: string, title: string): Book {
  const normalizedIsbn = normalizeIsbn(isbn);
  const normalizedTitle = title.trim() || `Rental ${normalizedIsbn}`;

  return {
    isbn: normalizedIsbn,
    title: normalizedTitle,
    author: {
      firstname: "Unknown",
      middlename: "",
      lastname: "Author",
      bio: "Book metadata supplied by the renting order.",
    },
    pages: 1,
    publisher: {
      name: "Unknown Publisher",
      address: {
        street: "Unknown Street",
        zipCode: "00000",
        city: "Unknown City",
      },
    },
    genres: ["Rental"],
    language: "Unknown",
    summary: "Rental order book entry.",
    publicationDate: new Date().toISOString().slice(0, 10),
    edition: 1,
    type: "HARDCOVER",
  };
}
