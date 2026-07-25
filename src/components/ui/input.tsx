import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'focus-ring min-h-12 w-full rounded-xl border border-white/12 bg-black/20 px-4 text-sm text-white placeholder:text-slate-500',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'focus-ring min-h-32 w-full rounded-xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500',
        className,
      )}
      {...props}
    />
  );
}
