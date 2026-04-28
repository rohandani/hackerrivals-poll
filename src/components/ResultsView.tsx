import type { Poll } from '../types/poll';

interface ResultsViewProps {
  poll: Poll;
  votedOptionId: number | null;
}

export default function ResultsView({ poll, votedOptionId }: ResultsViewProps) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);

  return (
    <div aria-label="Poll results">
      <h2 className="font-heading text-lg sm:text-xl font-bold text-center mb-6 text-white">
        {poll.question}
      </h2>

      <div className="space-y-4">
        {poll.options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const isUserVote = option.id === votedOptionId;

          return (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between items-center text-sm font-body">
                <span className={`text-white ${isUserVote ? 'font-bold' : ''}`}>
                  {option.text}
                  {isUserVote && (
                    <span className="ml-2 text-highlight" aria-label="Your vote">✓</span>
                  )}
                </span>
                <span className="text-gray-400">{pct}%</span>
              </div>
              <div
                className="h-3 w-full rounded-full bg-card-bg overflow-hidden"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${option.text}: ${pct}%`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isUserVote ? 'bg-highlight' : 'bg-accent'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-sm text-gray-400">
        Total: {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </p>

      {votedOptionId !== null && (
        <p className="mt-3 text-center text-sm text-highlight font-body">
          ✅ Your vote has been recorded
        </p>
      )}
    </div>
  );
}
