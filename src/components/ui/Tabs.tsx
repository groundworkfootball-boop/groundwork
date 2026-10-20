import type { ReactNode } from 'react';
import { cn } from './cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export function Tabs({
  items,
  active,
  onChange,
  className,
  variant = 'pill',
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}) {
  if (variant === 'underline') {
    return (
      <div
        className={cn('gw-scrollbar-none flex gap-1 overflow-x-auto border-b border-white/[0.08]', className)}
        role="tablist"
      >
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.id)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-[13px] font-medium transition-colors',
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {item.icon}
              {item.label}
              {typeof item.count === 'number' && (
                <span
                  className={cn(
                    'gw-numeric rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    isActive ? 'bg-brand/15 text-brand' : 'bg-white/[0.07] text-slate-400',
                  )}
                >
                  {item.count}
                </span>
              )}
              {isActive && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'gw-scrollbar-none inline-flex gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-1',
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all',
              isActive ? 'bg-white/[0.10] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {item.icon}
            {item.label}
            {typeof item.count === 'number' && (
              <span className="gw-numeric text-[10px] font-bold text-slate-500">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
