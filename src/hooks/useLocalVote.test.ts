import { describe, it, expect, beforeEach } from 'vitest';
import { hasVoted, getVote, saveVote } from './useLocalVote';

beforeEach(() => {
  localStorage.clear();
});

describe('useLocalVote', () => {
  it('hasVoted returns false when no vote exists', () => {
    expect(hasVoted('poll-1')).toBe(false);
  });

  it('getVote returns null when no vote exists', () => {
    expect(getVote('poll-1')).toBeNull();
  });

  it('saveVote stores a vote and hasVoted returns true', () => {
    saveVote('poll-1', 3);
    expect(hasVoted('poll-1')).toBe(true);
  });

  it('getVote returns the saved vote record', () => {
    saveVote('poll-1', 3);
    const vote = getVote('poll-1');
    expect(vote).not.toBeNull();
    expect(vote!.optionId).toBe(3);
    expect(vote!.votedAt).toBeTruthy();
  });

  it('tracks votes independently per poll', () => {
    saveVote('poll-1', 1);
    saveVote('poll-2', 5);
    expect(hasVoted('poll-1')).toBe(true);
    expect(hasVoted('poll-2')).toBe(true);
    expect(hasVoted('poll-3')).toBe(false);
    expect(getVote('poll-1')!.optionId).toBe(1);
    expect(getVote('poll-2')!.optionId).toBe(5);
  });

  it('stores data under hr_poll_votes key', () => {
    saveVote('poll-1', 2);
    const raw = localStorage.getItem('hr_poll_votes');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed['poll-1']).toBeDefined();
    expect(parsed['poll-1'].optionId).toBe(2);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('hr_poll_votes', 'not-json');
    expect(hasVoted('poll-1')).toBe(false);
    expect(getVote('poll-1')).toBeNull();
  });
});
