import FilterListIcon from '@mui/icons-material/FilterList';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import NativeSelect from '@mui/material/NativeSelect';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ChangeEvent } from 'react';

import type { FilterField } from '../types/book';

interface FilterBarProps {
  field: FilterField;
  onFieldChange: (field: FilterField) => void;
  onQueryChange: (query: string) => void;
  query: string;
  resultCount: number;
}

const filterFields: Array<{ label: string; value: FilterField }> = [
  { label: 'Title', value: 'title' },
  { label: 'Author', value: 'author' },
];

export function FilterBar({
  field,
  onFieldChange,
  onQueryChange,
  query,
  resultCount,
}: FilterBarProps) {
  const handleFieldChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onFieldChange(event.target.value as FilterField);
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
    >
      <FormControl sx={{ minWidth: { xs: '100%', md: 152 } }} variant="standard">
        <InputLabel htmlFor="filter-field">Filter by</InputLabel>
        <NativeSelect
          inputProps={{
            'aria-label': 'Filter by',
            id: 'filter-field',
          }}
          onChange={handleFieldChange}
          value={field}
        >
          {filterFields.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel htmlFor="filter-query">Filter results</InputLabel>
        <OutlinedInput
          id="filter-query"
          label="Filter results"
          onChange={(event) => onQueryChange(event.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <FilterListIcon color="action" fontSize="small" />
            </InputAdornment>
          }
          value={query}
        />
      </FormControl>

      <Typography color="text.secondary" sx={{ whiteSpace: 'nowrap' }} variant="body2">
        {resultCount} {resultCount === 1 ? 'book' : 'books'}
      </Typography>
    </Stack>
  );
}
