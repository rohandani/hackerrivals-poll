import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getPollById, getAllPolls, createPoll, castVote } from '../models/poll.js';

const router = Router();

function generateFingerprint(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex');
}

// GET /api/polls - List all polls
router.get('/', (_req: Request, res: Response) => {
  try {
    const polls = getAllPolls();
    res.json(polls);
  } catch {
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// GET /api/polls/:pollId - Get a single poll
router.get('/:pollId', (req: Request, res: Response) => {
  try {
    const poll = getPollById(req.params.pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    res.json(poll);
  } catch {
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// POST /api/polls/:pollId/vote - Cast a vote
router.post('/:pollId/vote', (req: Request, res: Response) => {
  try {
    const { optionId } = req.body;
    if (typeof optionId !== 'number') {
      return res.status(400).json({ error: 'optionId is required and must be a number' });
    }

    const fingerprint = generateFingerprint(req);
    const result = castVote(req.params.pollId, optionId, fingerprint);

    if (!result.success) {
      if (result.error === 'poll_not_found') {
        return res.status(404).json({ error: 'Poll not found' });
      }
      if (result.error === 'option_not_found') {
        return res.status(400).json({ error: 'Invalid option' });
      }
      if (result.error === 'duplicate_vote') {
        return res.status(409).json({ error: 'You have already voted on this poll' });
      }
    }

    res.json({ success: true, poll: result.poll });
  } catch {
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// POST /api/polls - Create a new poll
router.post('/', (req: Request, res: Response) => {
  try {
    const { question, options } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'At least 2 options are required' });
    }
    if (options.some((o: any) => typeof o !== 'string' || o.trim() === '')) {
      return res.status(400).json({ error: 'All options must be non-empty strings' });
    }

    const poll = createPoll(question.trim(), options.map((o: string) => o.trim()));
    res.status(201).json(poll);
  } catch {
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

export default router;
