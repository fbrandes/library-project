import type { Book } from "../types/book";

export function createBook(overrides: Partial<Book> = {}): Book {
  return {
    author: {
      bio: "Software engineer and author focused on Java.",
      firstname: "Joshua",
      lastname: "Bloch",
      middlename: "",
    },
    edition: 3,
    genres: ["Programming", "Java"],
    isbn: "9780134685991",
    language: "English",
    pages: 416,
    publicationDate: "2018-01-06",
    publisher: {
      address: {
        city: "Boston",
        street: "75 Arlington Street",
        zipCode: "02116",
      },
      name: "Addison-Wesley Professional",
    },
    summary: "A practical guide to writing robust Java code.",
    title: "Effective Java",
    type: "hardcover",
    ...overrides,
  };
}

export const effectiveJava = createBook();

export const domainDrivenDesign = createBook({
  author: {
    bio: "Author known for domain-driven design.",
    firstname: "Eric",
    lastname: "Evans",
    middlename: "",
  },
  edition: 1,
  genres: ["Software Design"],
  isbn: "9780321125217",
  pages: 560,
  publicationDate: "2003-08-30",
  publisher: {
    address: {
      city: "Boston",
      street: "75 Arlington Street",
      zipCode: "02116",
    },
    name: "Addison-Wesley Professional",
  },
  summary: "A guide to complex software model design.",
  title: "Domain-Driven Design",
  type: "hardcover",
});
