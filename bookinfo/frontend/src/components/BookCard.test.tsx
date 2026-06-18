import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithTheme } from '../test/renderWithTheme';
import { BookCard } from './BookCard';

describe('BookCard', () => {
  it('renders book details', () => {
    renderWithTheme(
      <BookCard
        book={{
          author: 'Joshua Bloch',
          isbn: '9780134685991',
          pages: 416,
          title: 'Effective Java',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Effective Java' })).toBeInTheDocument();
    expect(screen.getByText('Joshua Bloch')).toBeInTheDocument();
    expect(screen.getByText('ISBN 9780134685991')).toBeInTheDocument();
    expect(screen.getByText('416 pages')).toBeInTheDocument();
  });
});
