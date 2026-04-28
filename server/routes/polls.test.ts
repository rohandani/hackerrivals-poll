import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-routes.db');

if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

process.env.DB_PATH = TEST_DB_PATH;

// Dynamic imports so DB_PATH env is set first
const { default: pollRoutes } = await import('./polls.js');

const app = express();
app.use(express.json());
app.use('/api/polls', pollRoutes);

describe('Poll API Routes', () => {
  beforeEach(() => {
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

  describe('POST /api/polls', () => {
    it('should create a poll', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send({ question: 'Test?', options: ['A', 'B'] });
      expect(res.status).toBe(201);
      expect(res.body.question).toBe('Test?');
      expect(res.body.options).toHaveLength(2);
      expect(res.body.id).toBeDefined();
    });

    it('should reject empty question', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send({ question: '', options: ['A', 'B'] });
      expect(res.status).toBe(400);
    });

    it('should reject fewer than 2 options', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send({ question: 'Test?', options: ['A'] });
      expect(res.status).toBe(400);
    });

    it('should reject empty option strings', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send({ question: 'Test?', options: ['A', ''] });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/polls', () => {
    it('should return all polls', async () => {
      await request(app).post('/api/polls').send({ question: 'Q1?', options: ['A', 'B'] });
      await request(app).post('/api/polls').send({ question: 'Q2?', options: ['C', 'D'] });
      const res = await request(app).get('/api/polls');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should return empty array when no polls', async () => {
      const res = await request(app).get('/api/polls');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/polls/:pollId', () => {
    it('should return a poll by ID', async () => {
      const created = await request(app)
        .post('/api/polls')
        .send({ question: 'Find me?', options: ['X', 'Y'] });
      const res = await request(app).get(`/api/polls/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.question).toBe('Find me?');
    });

    it('should return 404 for non-existent poll', async () => {
      const res = await request(app).get('/api/polls/does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/polls/:pollId/vote', () => {
    it('should cast a vote', async () => {
      const created = await request(app)
        .post('/api/polls')
        .send({ question: 'Vote?', options: ['A', 'B'] });
      const optionId = created.body.options[0].id;
      const res = await request(app)
        .post(`/api/polls/${created.body.id}/vote`)
        .send({ optionId });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.poll.options[0].voteCount).toBe(1);
    });

    it('should return 409 for duplicate vote from same client', async () => {
      const created = await request(app)
        .post('/api/polls')
        .send({ question: 'Dup?', options: ['A', 'B'] });
      const optionId = created.body.options[0].id;
      await request(app)
        .post(`/api/polls/${created.body.id}/vote`)
        .send({ optionId });
      const res = await request(app)
        .post(`/api/polls/${created.body.id}/vote`)
        .send({ optionId });
      expect(res.status).toBe(409);
    });

    it('should return 404 for non-existent poll', async () => {
      const res = await request(app)
        .post('/api/polls/fake-id/vote')
        .send({ optionId: 1 });
      expect(res.status).toBe(404);
    });

    it('should return 400 for missing optionId', async () => {
      const created = await request(app)
        .post('/api/polls')
        .send({ question: 'No opt?', options: ['A', 'B'] });
      const res = await request(app)
        .post(`/api/polls/${created.body.id}/vote`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid option', async () => {
      const created = await request(app)
        .post('/api/polls')
        .send({ question: 'Bad opt?', options: ['A', 'B'] });
      const res = await request(app)
        .post(`/api/polls/${created.body.id}/vote`)
        .send({ optionId: 99999 });
      expect(res.status).toBe(400);
    });
  });
});
