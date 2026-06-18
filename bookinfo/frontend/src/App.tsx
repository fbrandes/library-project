import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo } from 'react';

import { BookList } from './components/BookList';
import { FilterBar } from './components/FilterBar';
import { SearchBar } from './components/SearchBar';
import { ThemeModeToggle } from './components/ThemeModeToggle';
import { filterBooks, useBookInfoStore } from './stores/bookInfoStore';

export default function App() {
  const books = useBookInfoStore((state) => state.books);
  const error = useBookInfoStore((state) => state.error);
  const filterField = useBookInfoStore((state) => state.filterField);
  const filterQuery = useBookInfoStore((state) => state.filterQuery);
  const isLoading = useBookInfoStore((state) => state.isLoading);
  const loadBooks = useBookInfoStore((state) => state.loadBooks);
  const searchBooks = useBookInfoStore((state) => state.searchBooks);
  const searchField = useBookInfoStore((state) => state.searchField);
  const searchQuery = useBookInfoStore((state) => state.searchQuery);
  const setFilterField = useBookInfoStore((state) => state.setFilterField);
  const setFilterQuery = useBookInfoStore((state) => state.setFilterQuery);
  const setSearchField = useBookInfoStore((state) => state.setSearchField);
  const setSearchQuery = useBookInfoStore((state) => state.setSearchQuery);
  const visibleBooks = useMemo(
    () => filterBooks(books, filterField, filterQuery),
    [books, filterField, filterQuery],
  );

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack
            component="header"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Typography component="h1" variant="h4">
              Bookinfo
            </Typography>
            <ThemeModeToggle />
          </Stack>

          <Paper component="section" sx={{ p: 2 }} variant="outlined">
            <SearchBar
              field={searchField}
              isLoading={isLoading}
              onFieldChange={setSearchField}
              onQueryChange={setSearchQuery}
              onSubmit={searchBooks}
              query={searchQuery}
            />
          </Paper>

          {books.length > 0 ? (
            <Paper component="section" sx={{ p: 2 }} variant="outlined">
              <FilterBar
                field={filterField}
                onFieldChange={setFilterField}
                onQueryChange={setFilterQuery}
                query={filterQuery}
                resultCount={visibleBooks.length}
              />
            </Paper>
          ) : null}

          <BookList books={visibleBooks} error={error} isLoading={isLoading} />
        </Stack>
      </Container>
    </Box>
  );
}
