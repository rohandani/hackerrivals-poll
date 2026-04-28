import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

// We'll create an in-memory DB and override the module's db for testing
// To do this cleanly, we test the logic by importing the module which uses the file-based db,
// but we'll set DB_PATH to a temp file for isolation.

import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-polls.db');

// Clean up before tests
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

// Set env before importing the module
process.env.DB_PATH = TEST_DB_PATH;

// Dynamic import so env is set first
const { getPollById, getAllPolls, createPoll, castVote } = await import('./poll.js');

describe('Poll Model', () => {
  let pollId: string;

  beforeEach(() => {
    // Clean tables before each test
    const db = new Database(TEST_DB_PATH);
    db.exec('DELETE FROM votes');
    db.exec('DELETE FROM poll_options');
    db.exec('DELETE FROM polls');
    db.close();
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('createPoll', () => {
    it('should create a poll with options', () => {
      const poll = createPoll('Favorite color?', ['Red', 'Blue', 'Green']);
      expect(poll.id).toBeDefined();
      expect(poll.question).toBe('Favorite color?');
      expect(poll.options).toHaveLength(3);
      expect(poll.options[0].text).toBe('Red');
      expect(poll.options[0].voteCount).toBe(0);
    });
  });

  describe('getPollById', () => {
    it('should return a poll by ID', () => {
      const created = createPoll('Test poll?', ['A', 'B']);
      const poll = getPollById(created.id);
      expect(poll).not.toBeNull();
      expect(poll!.question).toBe('Test poll?');
      expect(poll!.options).toHaveLength(2);
    });

    it('should return null for non-existent poll', () => {
      const poll = getPollById('non-existent-id');
      expect(poll).toBeNull();
    });
  });

  describe('getAllPolls', () => {
    it('should return all polls', () => {
      createPoll('Poll 1?', ['A', 'B']);
      createPoll('Poll 2?', ['C', 'D']);
      const polls = getAllPolls();
      expect(polls).toHaveLength(2);
    });

    it('should return empty array when no polls exist', () => {
      const polls = getAllPolls();
      expect(polls).toHaveLength(0);
    });
  });

  describe('castVote', () => {
    it('should cast a vote successfully', () => {
      const poll = createPoll('Vote test?', ['Yes', 'No']);
      const result = castVote(poll.id, poll.options[0].id, 'fingerprint-1');
      expect(result.success).toBe(true);
      expect(result.poll).toBeDefined();
      expect(result.poll!.options[0].voteCount).toBe(1);
      expect(result.poll!.options[1].voteCount).toBe(0);
    });

    it('should reject duplicate votes from same fingerprint', () => {
      const poll = createPoll('Dup test?', ['A', 'B']);
      castVote(poll.id, poll.options[0].id, 'fingerprint-dup');
      const result = castVote(poll.id, poll.options[1].id, 'fingerprint-dup');
      expect(result.success).toBe(false);
      expect(result.error).toBe('duplicate_vote');
    });

    it('should allow different fingerprints to vote', () => {
      const poll = createPoll('Multi test?', ['A', 'B']);
      castVote(poll.id, poll.options[0].id, 'fp-1');
      const result = castVote(poll.id, poll.options[0].id, 'fp-2');
      expect(result.success).toBe(true);
      expect(result.poll!.options[0].voteCount).toBe(2);
    });

    it('should return error for non-existent poll', () => {
      const result = castVote('fake-id', 1, 'fp');
      expect(result.success).toBe(false);
      expect(result.error).toBe('poll_not_found');
    });

    it('should return error for non-existent option', () => {
      const poll = createPoll('Option test?', ['A']);
      const result = castVote(poll.id, 99999, 'fp');
      expect(result.success).toBe(false);
      expect(result.error).toBe('option_not_found');
    });
  });
});
