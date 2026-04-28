import { useState } from 'react';
import type { Poll } from '../types/poll';

interface VoteFormProps {
  poll: Poll;
  onVote: (optionId: number) => void;
  isSubmitting?: boolean;
}

export default function VoteForm({ poll, onVote, isSubmitting = false }: VoteFormProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId !== null) {
      onVote(selectedId);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Poll voting form">
      <h2 className="font-heading text-lg sm:text-xl font-bold text-center mb-6 text-white">
        {poll.question}
      </h2>

      <fieldset disabled={isSubmitting}>
        <legend className="sr-only">Select your answer</legend>
        <div className="space-y-3" role="radiogroup" aria-label="Poll options">
          {poll.options.map((option) => {
            const isSelected = selectedId === option.id;
            return (
              <label
                key={option.id}
                className={`
                  block cursor-pointer rounded-lg border p-4 transition-all duration-200
                  ${isSelected
                    ? 'border-accent bg-accent/10 shadow-glow'
                    : 'border-card-border bg-card-bg hover:border-accent/50 hover:shadow-glow/50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="poll-option"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setSelectedId(option.id)}
                  className="sr-only"
                  aria-label={option.text}
                />
                <span className="font-body text-base sm:text-lg text-white">{option.text}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={selectedId === null || isSubmitting}
        className="mt-6 w-full rounded-lg bg-accent py-3 font-heading text-sm font-bold tracking-wider text-white
          transition-all duration-200 hover:bg-accent-light hover:shadow-glow-lg
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
        aria-label="Cast your vote"
      >
        {isSubmitting ? 'Submitting…' : 'Cast Your Vote'}
      </button>
    </form>
  );
}
