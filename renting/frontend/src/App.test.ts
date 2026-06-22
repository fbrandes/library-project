import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App.svelte';
import { rentingStore } from './stores/rentingStore';
import { orderFixture } from './test/fixtures';

describe('App', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    rentingStore.getState().reset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders the renting workspace and loads orders', async () => {
    const { container } = render(App);

    expect(screen.getByText('Renting')).toBeInTheDocument();
    expect(screen.getByText('New rental')).toBeInTheDocument();
    expect(container.querySelector('md-filled-button')).toHaveTextContent('Rent book');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/orders', {
        headers: {
          Accept: 'application/json',
        },
      });
    });
  });

  it('creates a rental order from the form', async () => {
    const created = orderFixture();
    fetchMock.mockResolvedValueOnce(jsonResponse([])).mockResolvedValueOnce(jsonResponse(created));
    const { container } = render(App);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith('/api/orders', expect.objectContaining({ method: 'POST' }));
    });
    expect(await screen.findByText('Effective Go Services')).toBeInTheDocument();
  });

  it('updates and cancels existing orders', async () => {
    const existing = orderFixture();
    const updated = orderFixture({ state: 'PROCESSED' });
    fetchMock
      .mockResolvedValueOnce(jsonResponse([existing]))
      .mockResolvedValueOnce(jsonResponse(updated))
      .mockResolvedValueOnce(new Response('', { status: 204, statusText: 'No Content' }));

    render(App);

    expect(await screen.findByText('Effective Go Services')).toBeInTheDocument();
    await fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`/api/orders/${existing.id}`, expect.objectContaining({ method: 'PUT' }));
    });
    expect(await screen.findByText('PROCESSED')).toBeInTheDocument();

    await fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`/api/orders/${existing.id}`, expect.objectContaining({ method: 'DELETE' }));
    });
  });

  it('shows API errors', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 500, statusText: 'Broken' }));

    render(App);

    expect(await screen.findByRole('alert')).toHaveTextContent('Broken');
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
