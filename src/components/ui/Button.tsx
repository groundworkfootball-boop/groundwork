import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-ink-950 font-semibold hover:bg-brand-hover shadow-[0_10px_30px_-12px_rgba(204,255,0,0.55)] active:translate-y-px',
  secondary:
    'bg-white/[0.07] text-white font-medium border border-white/10 hover:bg-white/[0.12] hover:border-white/20 active:translate-y-px',
  ghost: 'text-slate-300 font-medium hover:bg-white/[0.06] hover:text-white',
  outline:
    'border border-brand/40 text-brand font-semibold hover:bg-brand/10 hover:border-brand/70 active:translate-y-px',
  danger: 'bg-rose-500/90 text-white font-semibold hover:bg-rose-500 active:translate-y-px',
  subtle: 'bg-white/[0.04] text-slate-200 font-medium hover:bg-white/[0.08]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-[3.25rem] px-7 text-[15px] gap-2.5 rounded-xl',
  icon: 'h-10 w-10 rounded-xl justify-center',
};

const BASE =
  'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 disabled:pointer-events-none disabled:opacity-45 select-none';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, iconLeft, iconRight, fullWidth, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
