import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="groundwork-card max-w-xl p-8 text-center sm:p-10">
        <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
          The page you requested does not exist in the current route map. Return to the platform shell or the public home page.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.02]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Public home
          </Link>
        </div>
      </div>
    </div>
  );
};