import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from '../../lib/clsx';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-md border border-line bg-surface px-4 py-2.5 text-sm text-ink',
        'outline-none transition-colors duration-fast placeholder:text-muted',
        'focus-visible:border-verified',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
