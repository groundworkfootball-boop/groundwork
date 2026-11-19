/**
 * GROUNDWORK — Application Providers
 * 
 * Wraps the app in all necessary context providers:
 * - TanStack Query (data fetching/caching)
 * - Auth
 * - Toast
 * - Error boundary
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../lib/toast';
import { Sentry } from '../lib/sentry';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function FallbackError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
          <svg className="h-8 w-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">Something went wrong</h2>
        <p className="mb-6 text-sm text-slate-400">
          {error.message || 'An unexpected error occurred. Please try refreshing the page.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={({ error }) => <FallbackError error={error as Error} />}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

export { queryClient };
