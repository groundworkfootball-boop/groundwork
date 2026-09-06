import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeaturePageProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: Array<{ label: string; to: string; primary?: boolean }>;
  bullets?: string[];
  metrics?: Array<{ label: string; value: string }>;
}

export const FeaturePage = ({ eyebrow, title, description, actions, bullets, metrics }: FeaturePageProps) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="groundwork-card relative overflow-hidden p-8 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(204,255,0,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_26%)]" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </span>
          <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{description}</p>
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {actions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className={
                    action.primary
                      ? 'inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.02]'
                      : 'inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10'
                  }
                >
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {metrics && metrics.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="groundwork-card p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
              <p className="mt-3 text-2xl font-black text-white">{metric.value}</p>
            </article>
          ))}
        </section>
      )}

      {bullets && bullets.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bullets.map((bullet) => (
            <article key={bullet} className="groundwork-card p-5">
              <p className="text-sm leading-6 text-slate-300">{bullet}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};
