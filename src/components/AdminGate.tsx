import { useState, type ReactNode } from 'react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';
const SESSION_KEY = 'hr_admin_auth';

function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export default function AdminGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      setError('');
    } else {
      setError('Incorrect password.');
    }
  };

  if (authed) return <>{children}</>;

  return (
    <form onSubmit={handleSubmit} aria-label="Admin login" className="max-w-sm mx-auto py-12">
      <h2 className="font-heading text-lg font-bold text-center mb-6 text-white">Admin Access</h2>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <label className="block mb-4">
        <span className="block mb-1 text-sm text-gray-400 font-body">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-card-border bg-card-bg p-3 text-white font-body
            placeholder:text-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <button
        type="submit"
        disabled={password === ''}
        className="w-full rounded-lg bg-accent py-3 font-heading text-sm font-bold tracking-wider text-white
          transition-all duration-200 hover:bg-accent-light hover:shadow-glow-lg
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        Enter
      </button>
    </form>
  );
}
