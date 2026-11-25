import type { ReactNode } from 'react';
import { cn } from '../ui/cn';

export interface MediaFrameProps {
  src: string;
  alt: string;
  caption?: string;
  tag?: string;
  aspect?: 'video' | 'wide' | 'square' | 'tall';
  className?: string;
  overlay?: ReactNode;
}

const ASPECT_CLASS: Record<NonNullable<MediaFrameProps['aspect']>, string> = {
  video: 'aspect-video',
  wide: 'aspect-[16/10]',
  square: 'aspect-square',
  tall: 'aspect-[4/3]',
};

/**
 * Architectural media frame for real football photography.
 * Keeps consistent corner radii, crisp image framing, and optional bottom metadata bar.
 */
export function MediaFrame({
  src,
  alt,
  caption,
  tag,
  aspect = 'wide',
  className,
  overlay,
}: MediaFrameProps) {
  return (
    <figure
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/60',
        className,
      )}
    >
      <div className={cn('relative w-full overflow-hidden bg-ink-950', ASPECT_CLASS[aspect])}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
        {overlay}
      </div>
      {(caption || tag) && (
        <figcaption className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-ink-950/90 px-4 py-2.5">
          <span className="truncate text-[12px] font-medium text-slate-200">{caption}</span>
          {tag ? <span className="gw-mono shrink-0 text-slate-500">{tag}</span> : null}
        </figcaption>
      )}
    </figure>
  );
}
