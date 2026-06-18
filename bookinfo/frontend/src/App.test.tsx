import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { bookInfoStore } from './stores/bookInfoStore';
import { domainDrivenDesign, effectiveJava } from './test/bookFixtures';
import { renderWithTheme } from './test/renderWithTheme';
import type { Book } from './types/book';

const books: Book[] = [effectiveJava, domainDrivenDesign];

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
  });
}

describe('App', () => {
  beforeEach(() => {
    bookInfoStore.getState().reset('light');
  });

  it('loads books and filters displayed results', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(books)));

    renderWithTheme(<App />);

    expect(await screen.findByRole('heading', { name: 'Effective Java' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Domain-Driven Design' })).toBeInTheDocument();
    expect(screen.getByLabelText('Filter results')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by' }), 'author');
    await user.type(screen.getByLabelText('Filter results'), 'Bloch');

    expect(screen.getByRole('heading', { name: 'Effective Java' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Domain-Driven Design' })).not.toBeInTheDocument();
    expect(screen.getByText('1 book')).toBeInTheDocument();
  });

  it('searches by title and shows matching books', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(jsonResponse(books)).mockResolvedValueOnce(jsonResponse(books)),
    );

    renderWithTheme(<App />);

    expect(await screen.findByRole('heading', { name: 'Effective Java' })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Search by' }), 'title');
    await user.type(screen.getByLabelText('Search books'), 'domain');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Domain-Driven Design' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Effective Java' })).not.toBeInTheDocument();
  });
});
