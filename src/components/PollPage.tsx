import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Poll } from '../types/poll';
import { fetchPoll, submitVote } from '../api/pollApi';
import { hasVoted, getVote, saveVote, clearVote } from '../hooks/useLocalVote';
import VoteForm from './VoteForm';
import ResultsView from './ResultsView';
import ErrorPage from './ErrorPage';

type Status = 'loading' | 'ready' | 'not-found' | 'error';

export default function PollPage() {
  const { pollId } = useParams<{ pollId: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverRejected, setServerRejected] = useState(false);

  const loadPoll = useCallback(async () => {
    if (!pollId) return;
    setStatus('loading');
    try {
      const data = await fetchPoll(pollId);
      setPoll(data);
      const existing = getVote(pollId);
      if (existing) {
        const optionStillExists = data.options.some((o) => o.id === existing.optionId);
        if (optionStillExists) {
          setVotedOptionId(existing.optionId);
        } else {
          clearVote(pollId);
          setVotedOptionId(null);
        }
      }
      setStatus('ready');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setStatus(message === 'Poll not found' ? 'not-found' : 'error');
    }
  }, [pollId]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  const handleVote = async (optionId: number) => {
    if (!pollId) return;
    setIsSubmitting(true);
    try {
      const { poll: updated } = await submitVote(pollId, optionId);
      setPoll(updated);
      saveVote(pollId, optionId);
      setVotedOptionId(optionId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'Already voted') {
        setServerRejected(true);
        const current = await fetchPoll(pollId).catch(() => null);
        if (current) setPoll(current);
        setVotedOptionId(null);
      } else {
        setStatus('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="text-center py-12" role="status" aria-label="Loading poll">
        <p className="font-heading text-accent text-lg animate-pulse">Loading…</p>
      </div>
    );
  }

  if (status === 'not-found') {
    return <ErrorPage type="not-found" />;
  }

  if (status === 'error' || !poll) {
    return <ErrorPage type="error" onRetry={loadPoll} />;
  }

  const alreadyVoted = pollId ? hasVoted(pollId) : false;
  const showResults = (alreadyVoted && votedOptionId !== null) || serverRejected;

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-6 shadow-lg">
      {showResults ? (
        <>
          <span className="mb-4 inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-heading text-accent tracking-wider">
            Already voted
          </span>
          {poll.showResults ? (
            <ResultsView poll={poll} votedOptionId={votedOptionId} />
          ) : (
            <div className="text-center py-6">
              <h2 className="font-heading text-lg sm:text-xl font-bold text-white mb-4">
                {poll.question}
              </h2>
              {votedOptionId !== null && (
                <p className="text-white font-body mb-3">
                  You voted: <span className="text-highlight font-bold">{poll.options.find((o) => o.id === votedOptionId)?.text}</span>
                </p>
              )}
              <p className="text-highlight font-body">✅ Your vote has been recorded</p>
              <p className="text-sm text-gray-400 mt-2">Results will be revealed later.</p>
            </div>
          )}
        </>
      ) : (
        <VoteForm poll={poll} onVote={handleVote} isSubmitting={isSubmitting} />
      )}
    </div>
  );
}
