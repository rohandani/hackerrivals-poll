import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll } from '../api/pollApi';

export default function CreatePollPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    question.trim() !== '' &&
    options.filter((o) => o.trim() !== '').length >= 2 &&
    !isSubmitting;

  const addOption = () => setOptions([...options, '']);

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o !== '');
    if (trimmedOptions.length < 2) {
      setError('At least 2 non-empty options are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const poll = await createPoll({ question: question.trim(), options: trimmedOptions });
      navigate(`/poll/${poll.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create poll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Create a new poll">
      <h2 className="font-heading text-lg sm:text-xl font-bold text-center mb-6 text-white">
        Create a Poll
      </h2>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <label className="block mb-4">
        <span className="block mb-1 text-sm text-gray-400 font-body">Question</span>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What do you want to ask?"
          className="w-full rounded-lg border border-card-border bg-card-bg p-3 text-white font-body
            placeholder:text-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <fieldset className="mb-2">
        <legend className="block mb-1 text-sm text-gray-400 font-body">Options</legend>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
                className="flex-1 rounded-lg border border-card-border bg-card-bg p-3 text-white font-body
                  placeholder:text-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label={`Remove option ${i + 1}`}
                  className="rounded-lg border border-card-border bg-card-bg px-3 text-gray-400
                    hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={addOption}
        className="mb-6 text-sm text-accent hover:text-accent-light font-body transition-colors"
      >
        + Add option
      </button>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-accent py-3 font-heading text-sm font-bold tracking-wider text-white
          transition-all duration-200 hover:bg-accent-light hover:shadow-glow-lg
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {isSubmitting ? 'Creating…' : 'Create Poll'}
      </button>
    </form>
  );
}
