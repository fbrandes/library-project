import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Book } from '../types/book';
import { domainDrivenDesign, effectiveJava } from '../test/bookFixtures';
import { renderWithTheme } from '../test/renderWithTheme';
import { BookList } from './BookList';

const books: Book[] = [effectiveJava, domainDrivenDesign];

describe('BookList', () => {
  it('renders a loading state', () => {
    renderWithTheme(<BookList books={[]} error={null} isLoading />);

    expect(screen.getByRole('status', { name: 'Loading books' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders an error state', () => {
    renderWithTheme(<BookList books={[]} error="Backend unavailable" isLoading={false} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Backend unavailable');
  });

  it('renders an empty state', () => {
    renderWithTheme(<BookList books={[]} error={null} isLoading={false} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No books found.');
  });

  it('renders books', () => {
    renderWithTheme(<BookList books={books} error={null} isLoading={false} />);

    expect(screen.getByRole('heading', { name: 'Effective Java' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Domain-Driven Design' })).toBeInTheDocument();
  });
});
