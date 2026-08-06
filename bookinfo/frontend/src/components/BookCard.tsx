import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { getAuthorDisplayName, type Book } from "../types/book";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Stack spacing={0.5}>
            <Typography component="h2" variant="h6">
              {book.title}
            </Typography>
            <Typography color="text.secondary" variant="body1">
              {getAuthorDisplayName(book.author)}
            </Typography>
          </Stack>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip label={`ISBN ${book.isbn}`} size="small" variant="outlined" />
            <Chip
              label={`${book.pages} pages`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${book.edition}. edition`}
              size="small"
              variant="outlined"
            />
            <Chip label={book.type} size="small" variant="outlined" />
            <Chip label={book.language} size="small" variant="outlined" />
          </Box>

          <Typography color="text.secondary" variant="body2">
            {book.publisher.name} · {book.publicationDate}
          </Typography>

          <Typography variant="body2">{book.summary}</Typography>

          <Typography color="text.secondary" variant="body2">
            {book.genres.join(", ")}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
