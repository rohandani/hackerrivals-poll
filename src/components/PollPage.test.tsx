import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PollPage from './PollPage';
import ErrorPage from './ErrorPage';
import type { Poll, VoteResponse } from '../types/poll';

const mockPoll: Poll = {
  id: 'poll-abc',
  question: 'Best language?',
  options: [
    { id: 1, text: 'TypeScript', voteCount: 10 },
    { id: 2, text: 'Rust', voteCount: 7 },
    { id: 3, text: 'Go', voteCount: 3 },
  ],
  createdAt: '2026-04-27T00:00:00Z',
};

const votedPoll: Poll = {
  ...mockPoll,
  options: [
    { id: 1, text: 'TypeScript', voteCount: 11 },
    { id: 2, text: 'Rust', voteCount: 7 },
    { id: 3, text: 'Go', voteCount: 3 },
  ],
};

function renderAtRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/poll/:pollId" element={<PollPage />} />
        <Route path="*" element={<ErrorPage type="not-found" />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('PollPage integration', () => {
  it('shows options, votes, then shows results', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockPoll),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, poll: votedPoll } as VoteResponse),
      } as Response);

    renderAtRoute('/poll/poll-abc');

    // Loading state
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    // Wait for poll to load and show options
    await waitFor(() => {
      expect(screen.getByText('Best language?')).toBeInTheDocument();
    });
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Rust')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cast your vote/i })).toBeInTheDocument();

    // Select an option and vote
    fireEvent.click(screen.getByLabelText('TypeScript'));
    fireEvent.click(screen.getByRole('button', { name: /cast your vote/i }));

    // Should show results after voting
    await waitFor(() => {
      expect(screen.getByText('✅ Your vote has been recorded')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Your vote')).toBeInTheDocument();

    // localStorage should be updated
    const raw = localStorage.getItem('hr_poll_votes');
    expect(raw).toBeTruthy();
    const store = JSON.parse(raw!);
    expect(store['poll-abc'].optionId).toBe(1);
  });

  it('shows results immediately when user has already voted', async () => {
    // Pre-populate localStorage
    localStorage.setItem(
      'hr_poll_votes',
      JSON.stringify({ 'poll-abc': { optionId: 2, votedAt: '2026-04-27T00:00:00Z' } }),
    );

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPoll),
    } as Response);

    renderAtRoute('/poll/poll-abc');

    await waitFor(() => {
      expect(screen.getByText('Best language?')).toBeInTheDocument();
    });

    // Should show "Already voted" badge and results, not the vote form
    expect(screen.getByText('Already voted')).toBeInTheDocument();
    expect(screen.getByText('✅ Your vote has been recorded')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cast your vote/i })).not.toBeInTheDocument();
  });

  it('shows not-found page for invalid poll ID', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    } as Response);

    renderAtRoute('/poll/bad-id');

    await waitFor(() => {
      expect(screen.getByText('Poll Not Found')).toBeInTheDocument();
    });
  });

  it('shows error page with retry on network error', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockPoll),
      } as Response);

    renderAtRoute('/poll/poll-abc');

    await waitFor(() => {
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('Best language?')).toBeInTheDocument();
    });
  });
});
