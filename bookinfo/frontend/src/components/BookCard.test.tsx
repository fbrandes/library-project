import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { effectiveJava } from '../test/bookFixtures';
import { renderWithTheme } from '../test/renderWithTheme';
import { BookCard } from './BookCard';

describe('BookCard', () => {
  it('renders book details', () => {
    renderWithTheme(<BookCard book={effectiveJava} />);

    expect(screen.getByRole('heading', { name: 'Effective Java' })).toBeInTheDocument();
    expect(screen.getByText('Joshua Bloch')).toBeInTheDocument();
    expect(screen.getByText('ISBN 9780134685991')).toBeInTheDocument();
    expect(screen.getByText('416 pages')).toBeInTheDocument();
    expect(screen.getByText('3. edition')).toBeInTheDocument();
    expect(screen.getByText('hardcover')).toBeInTheDocument();
    expect(screen.getByText('Addison-Wesley Professional · 2018-01-06')).toBeInTheDocument();
    expect(screen.getByText('Programming, Java')).toBeInTheDocument();
  });
});
