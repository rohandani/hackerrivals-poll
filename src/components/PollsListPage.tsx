import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAllPolls, deletePoll, updatePoll, togglePollShowResults } from '../api/pollApi';
import type { Poll } from '../types/poll';

export default function PollsListPage() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    loadPolls();
  }, []);

  async function loadPolls() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllPolls();
      setPolls(data);
    } catch {
      setError('Failed to load polls.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(pollId: string) {
    if (!confirm('Delete this poll? This cannot be undone.')) return;
    try {
      await deletePoll(pollId);
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
    } catch {
      setError('Failed to delete poll.');
    }
  }

  function startEdit(poll: Poll) {
    setEditingId(poll.id);
    setEditQuestion(poll.question);
    setEditOptions(poll.options.map((o) => o.text));
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError('');
  }

  async function saveEdit() {
    if (!editingId) return;
    const trimmedOptions = editOptions.map((o) => o.trim()).filter((o) => o !== '');
    if (editQuestion.trim() === '') {
      setEditError('Question is required.');
      return;
    }
    if (trimmedOptions.length < 2) {
      setEditError('At least 2 non-empty options are required.');
      return;
    }
    try {
      const updated = await updatePoll(editingId, {
        question: editQuestion.trim(),
        options: trimmedOptions,
      });
      setPolls((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update poll.');
    }
  }

  function totalVotes(poll: Poll) {
    return poll.options.reduce((sum, o) => sum + o.voteCount, 0);
  }

  async function handleToggleResults(poll: Poll) {
    try {
      const updated = await togglePollShowResults(poll.id, !poll.showResults);
      setPolls((prev) => prev.map((p) => (p.id === poll.id ? updated : p)));
    } catch {
      setError('Failed to toggle results visibility.');
    }
  }

  if (loading) {
    return <p className="text-center text-gray-400 py-12">Loading polls…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-lg sm:text-xl font-bold text-white">All Polls</h2>
        <Link
          to="/create"
          className="rounded-lg bg-accent px-4 py-2 font-heading text-xs font-bold tracking-wider text-white
            transition-all duration-200 hover:bg-accent-light hover:shadow-glow-lg"
        >
          + New Poll
        </Link>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {polls.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No polls yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-3">
          {polls.map((poll) => (
            <li key={poll.id} className="rounded-lg border border-card-border bg-card-bg p-4">
              {editingId === poll.id ? (
                <EditForm
                  question={editQuestion}
                  options={editOptions}
                  error={editError}
                  onQuestionChange={setEditQuestion}
                  onOptionsChange={setEditOptions}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                />
              ) : (
                <div>
                  <button
                    onClick={() => navigate(`/poll/${poll.id}`)}
                    className="text-left w-full"
                  >
                    <p className="font-body text-base text-white mb-1">{poll.question}</p>
                    <p className="text-xs text-gray-500">
                      {poll.options.length} options · {totalVotes(poll)} votes
                    </p>
                  </button>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => startEdit(poll)}
                      className="rounded border border-card-border px-3 py-1 text-xs text-gray-400
                        hover:border-accent hover:text-accent transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(poll.id)}
                      className="rounded border border-card-border px-3 py-1 text-xs text-gray-400
                        hover:border-red-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleToggleResults(poll)}
                      className={`ml-auto rounded border px-3 py-1 text-xs transition-colors ${
                        poll.showResults
                          ? 'border-green-500/50 text-green-400 hover:border-green-500'
                          : 'border-card-border text-gray-500 hover:border-gray-400'
                      }`}
                      title={poll.showResults ? 'Results visible to voters' : 'Results hidden from voters'}
                    >
                      {poll.showResults ? '📊 Results ON' : '🚫 Results OFF'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface EditFormProps {
  question: string;
  options: string[];
  error: string;
  onQuestionChange: (v: string) => void;
  onOptionsChange: (v: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

function EditForm({ question, options, error, onQuestionChange, onOptionsChange, onSave, onCancel }: EditFormProps) {
  const updateOption = (i: number, val: string) => {
    const updated = [...options];
    updated[i] = val;
    onOptionsChange(updated);
  };
  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    onOptionsChange(options.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="text-xs text-red-400">{error}</p>
      )}
      <input
        type="text"
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        aria-label="Edit question"
        className="w-full rounded border border-card-border bg-transparent p-2 text-sm text-white
          focus:border-accent focus:outline-none"
      />
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            aria-label={`Edit option ${i + 1}`}
            className="flex-1 rounded border border-card-border bg-transparent p-2 text-sm text-white
              focus:border-accent focus:outline-none"
          />
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => removeOption(i)}
              aria-label={`Remove option ${i + 1}`}
              className="px-2 text-gray-500 hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onOptionsChange([...options, ''])}
        className="text-xs text-accent hover:text-accent-light transition-colors"
      >
        + Add option
      </button>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          className="rounded bg-accent px-3 py-1 text-xs font-bold text-white hover:bg-accent-light transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-card-border px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
