import { Lock } from 'lucide-react';
import { cn } from './cn';

/**
 * Shown when Firestore refuses a read because the *deployed* ruleset is older
 * than the client. This is a deployment-order problem, so the copy tells the
 * operator what to run rather than blaming the user.
 */
export function RulesDeniedNotice({
  title = 'This panel needs the current security rules',
  resource,
  className,
}: {
  title?: string;
  resource: string;
  className?: string;
}) {
  return (
    <div
      className={cn('rounded-2xl border border-rose-500/25 bg-rose-500/[0.05] p-4', className)}
      role="status"
    >
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-rose-100">{title}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-rose-200/80">
            Reading <span className="font-mono text-[11.5px] text-rose-100">{resource}</span> was
            refused, which means the deployed Firestore rules predate this build. Run{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11.5px] text-rose-100">
              npm run deploy:rules
            </code>{' '}
            once, then reload. Nothing has been lost — the data is intact and the rest of the
            workspace still works.
          </p>
        </div>
      </div>
    </div>
  );
}
