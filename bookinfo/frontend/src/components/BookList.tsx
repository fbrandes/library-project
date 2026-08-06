import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import type { Book } from "../types/book";
import { BookCard } from "./BookCard";

interface BookListProps {
  books: Book[];
  error: string | null;
  isLoading: boolean;
}

export function BookList({ books, error, isLoading }: BookListProps) {
  if (isLoading) {
    return (
      <Stack
        aria-label="Loading books"
        role="status"
        sx={{ alignItems: "center", py: 6 }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (books.length === 0) {
    return <Alert severity="info">No books found.</Alert>;
  }

  return (
    <Box
      aria-label="Book results"
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, minmax(0, 1fr))",
        },
      }}
    >
      {books.map((book) => (
        <BookCard book={book} key={book.id ?? book.isbn} />
      ))}
    </Box>
  );
}
