interface ErrorPageProps {
  type?: 'not-found' | 'error';
  onRetry?: () => void;
}

export default function ErrorPage({ type = 'not-found', onRetry }: ErrorPageProps) {
  const isNotFound = type === 'not-found';

  return (
    <div className="text-center py-12" role="alert">
      <p className="text-5xl mb-4">{isNotFound ? '🔍' : '⚠️'}</p>
      <h2 className="font-heading text-xl font-bold text-white mb-2">
        {isNotFound ? 'Poll Not Found' : 'Something Went Wrong'}
      </h2>
      <p className="font-body text-gray-400 mb-6">
        {isNotFound
          ? "The poll you're looking for doesn't exist or has been removed."
          : 'We had trouble loading this page. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-accent px-6 py-2 font-heading text-sm font-bold tracking-wider text-white
            transition-all duration-200 hover:bg-accent-light hover:shadow-glow-lg"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
