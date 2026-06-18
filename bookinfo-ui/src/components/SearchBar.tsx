import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import NativeSelect from '@mui/material/NativeSelect';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import type { ChangeEvent, FormEvent } from 'react';

import type { SearchField } from '../types/book';

interface SearchBarProps {
  field: SearchField;
  isLoading: boolean;
  onFieldChange: (field: SearchField) => void;
  onQueryChange: (query: string) => void;
  onSubmit: () => void | Promise<void>;
  query: string;
}

const searchFields: Array<{ label: string; value: SearchField }> = [
  { label: 'ISBN', value: 'isbn' },
  { label: 'Title', value: 'title' },
  { label: 'Author', value: 'author' },
];

export function SearchBar({
  field,
  isLoading,
  onFieldChange,
  onQueryChange,
  onSubmit,
  query,
}: SearchBarProps) {
  const handleFieldChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onFieldChange(event.target.value as SearchField);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl sx={{ minWidth: { xs: '100%', sm: 152 } }} variant="standard">
          <InputLabel htmlFor="search-field">Search by</InputLabel>
          <NativeSelect
            inputProps={{
              'aria-label': 'Search by',
              id: 'search-field',
            }}
            onChange={handleFieldChange}
            value={field}
          >
            {searchFields.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel htmlFor="search-query">Search books</InputLabel>
          <OutlinedInput
            id="search-query"
            label="Search books"
            onChange={(event) => onQueryChange(event.target.value)}
            value={query}
          />
        </FormControl>

        <Button
          disabled={isLoading}
          startIcon={<SearchIcon />}
          sx={{ minHeight: 56, minWidth: { xs: '100%', sm: 132 } }}
          type="submit"
          variant="contained"
        >
          Search
        </Button>
      </Stack>
    </Box>
  );
}
