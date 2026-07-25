import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/cn';

export function buttonClass(variant: 'primary' | 'secondary' | 'ghost' = 'primary'): string {
  return cn(
    'focus-ring inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'primary' &&
      'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-950/30 hover:brightness-110',
    variant === 'secondary' &&
      'border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]',
    variant === 'ghost' && 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
  );
}

export function Button({
  className,
  children,
  variant = 'primary',
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }
>) {
  return (
    <button className={cn(buttonClass(variant), className)} {...props}>
      {children}
    </button>
  );
}
