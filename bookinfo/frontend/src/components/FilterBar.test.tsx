import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { renderWithTheme } from '../test/renderWithTheme';
import type { FilterField } from '../types/book';
import { FilterBar } from './FilterBar';

function FilterBarHarness() {
  const [field, setField] = useState<FilterField>('title');
  const [query, setQuery] = useState('');

  return (
    <FilterBar
      field={field}
      onFieldChange={setField}
      onQueryChange={setQuery}
      query={query}
      resultCount={2}
    />
  );
}

describe('FilterBar', () => {
  it('updates the selected field and query', async () => {
    const user = userEvent.setup();

    renderWithTheme(<FilterBarHarness />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by' }), 'author');
    await user.type(screen.getByLabelText('Filter results'), 'Bloch');

    expect(screen.getByRole('combobox', { name: 'Filter by' })).toHaveValue('author');
    expect(screen.getByDisplayValue('Bloch')).toBeInTheDocument();
    expect(screen.getByText('2 books')).toBeInTheDocument();
  });
});
