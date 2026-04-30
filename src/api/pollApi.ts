import type { Poll, VoteResponse, CreatePollPayload } from '../types/poll';

const BASE_URL = '/api';

const DEVICE_ID_KEY = 'hr_device_id';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function fetchPoll(pollId: string): Promise<Poll> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}`);
  if (res.status === 404) {
    throw new Error('Poll not found');
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch poll: ${res.status}`);
  }
  return res.json();
}

export async function submitVote(pollId: string, optionId: number): Promise<VoteResponse> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
    },
    body: JSON.stringify({ optionId }),
  });
  if (res.status === 409) {
    throw new Error('Already voted');
  }
  if (!res.ok) {
    throw new Error(`Failed to submit vote: ${res.status}`);
  }
  return res.json();
}

export async function createPoll(payload: CreatePollPayload): Promise<Poll> {
  const res = await fetch(`${BASE_URL}/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to create poll: ${res.status}`);
  }
  return res.json();
}

export async function fetchAllPolls(): Promise<Poll[]> {
  const res = await fetch(`${BASE_URL}/polls`);
  if (!res.ok) {
    throw new Error(`Failed to fetch polls: ${res.status}`);
  }
  return res.json();
}

export async function deletePoll(pollId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to delete poll: ${res.status}`);
  }
}

export async function updatePoll(pollId: string, payload: CreatePollPayload): Promise<Poll> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to update poll: ${res.status}`);
  }
  return res.json();
}

export async function togglePollShowResults(pollId: string, showResults: boolean): Promise<Poll> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/show-results`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ showResults }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to update poll: ${res.status}`);
  }
  return res.json();
}
