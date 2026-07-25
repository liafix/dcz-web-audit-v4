import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'surface-panel rounded-2xl border border-white/10 backdrop-blur-xl',
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}
