import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-body">
      <header className="py-4 px-4 text-center">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-accent tracking-wider">
          🏆 HackerRivals
        </h1>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="py-4 px-4 text-center text-sm text-gray-500">
        Powered by{' '}
        <span className="text-accent font-heading text-xs tracking-wide">HackerRivals</span>
      </footer>
    </div>
  );
}
