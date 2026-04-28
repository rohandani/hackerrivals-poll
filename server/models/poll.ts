import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export interface PollOption {
  id: number;
  text: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
}

export function getPollById(pollId: string): Poll | null {
  const row = db.prepare('SELECT id, question, created_at FROM polls WHERE id = ?').get(pollId) as
    | { id: string; question: string; created_at: string }
    | undefined;

  if (!row) return null;

  const options = db
    .prepare('SELECT id, text, vote_count FROM poll_options WHERE poll_id = ? ORDER BY id')
    .all(pollId) as { id: number; text: string; vote_count: number }[];

  return {
    id: row.id,
    question: row.question,
    createdAt: row.created_at,
    options: options.map((o) => ({ id: o.id, text: o.text, voteCount: o.vote_count })),
  };
}

export function getAllPolls(): Poll[] {
  const rows = db.prepare('SELECT id, question, created_at FROM polls ORDER BY created_at DESC').all() as {
    id: string;
    question: string;
    created_at: string;
  }[];

  return rows.map((row) => {
    const options = db
      .prepare('SELECT id, text, vote_count FROM poll_options WHERE poll_id = ? ORDER BY id')
      .all(row.id) as { id: number; text: string; vote_count: number }[];

    return {
      id: row.id,
      question: row.question,
      createdAt: row.created_at,
      options: options.map((o) => ({ id: o.id, text: o.text, voteCount: o.vote_count })),
    };
  });
}

export function createPoll(question: string, options: string[]): Poll {
  const id = uuidv4();
  const insertPoll = db.prepare('INSERT INTO polls (id, question) VALUES (?, ?)');
  const insertOption = db.prepare('INSERT INTO poll_options (poll_id, text) VALUES (?, ?)');

  const run = db.transaction(() => {
    insertPoll.run(id, question);
    for (const text of options) {
      insertOption.run(id, text);
    }
  });

  run();
  return getPollById(id)!;
}

export interface CastVoteResult {
  success: boolean;
  error?: 'poll_not_found' | 'option_not_found' | 'duplicate_vote';
  poll?: Poll;
}

export function castVote(pollId: string, optionId: number, voterFingerprint: string): CastVoteResult {
  const poll = getPollById(pollId);
  if (!poll) return { success: false, error: 'poll_not_found' };

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return { success: false, error: 'option_not_found' };

  const incrementVote = db.prepare('UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ?');
  const insertVote = db.prepare(
    'INSERT INTO votes (poll_id, option_id, voter_fingerprint) VALUES (?, ?, ?)'
  );

  try {
    const run = db.transaction(() => {
      insertVote.run(pollId, optionId, voterFingerprint);
      incrementVote.run(optionId);
    });
    run();
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, error: 'duplicate_vote' };
    }
    throw err;
  }

  return { success: true, poll: getPollById(pollId)! };
}
