const STORAGE_KEY = 'hr_poll_votes';

interface VoteRecord {
  optionId: number;
  votedAt: string;
}

type VoteStore = Record<string, VoteRecord>;

function getStore(): VoteStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function hasVoted(pollId: string): boolean {
  return pollId in getStore();
}

export function getVote(pollId: string): VoteRecord | null {
  return getStore()[pollId] ?? null;
}

export function saveVote(pollId: string, optionId: number): void {
  const store = getStore();
  store[pollId] = { optionId, votedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function clearVote(pollId: string): void {
  const store = getStore();
  delete store[pollId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
