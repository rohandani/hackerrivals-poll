import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPoll, submitVote } from './pollApi';
import type { Poll, VoteResponse } from '../types/poll';

const mockPoll: Poll = {
  id: 'test-123',
  question: 'Best framework?',
  options: [
    { id: 1, text: 'React', voteCount: 10 },
    { id: 2, text: 'Vue', voteCount: 5 },
  ],
  createdAt: '2026-04-27T00:00:00Z',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchPoll', () => {
  it('returns poll data on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPoll),
    } as Response);

    const poll = await fetchPoll('test-123');
    expect(poll).toEqual(mockPoll);
    expect(fetch).toHaveBeenCalledWith('/api/polls/test-123');
  });

  it('throws "Poll not found" on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    } as Response);

    await expect(fetchPoll('bad-id')).rejects.toThrow('Poll not found');
  });

  it('throws on server error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(fetchPoll('test-123')).rejects.toThrow('Failed to fetch poll: 500');
  });
});

describe('submitVote', () => {
  it('returns vote response on success', async () => {
    const voteResponse: VoteResponse = { success: true, poll: { ...mockPoll, options: [{ id: 1, text: 'React', voteCount: 11 }, { id: 2, text: 'Vue', voteCount: 5 }] } };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(voteResponse),
    } as Response);

    const result = await submitVote('test-123', 1);
    expect(result).toEqual(voteResponse);
    expect(fetch).toHaveBeenCalledWith('/api/polls/test-123/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId: 1 }),
    });
  });

  it('throws "Already voted" on 409', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Duplicate vote' }),
    } as Response);

    await expect(submitVote('test-123', 1)).rejects.toThrow('Already voted');
  });

  it('throws on server error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(submitVote('test-123', 1)).rejects.toThrow('Failed to submit vote: 500');
  });
});
