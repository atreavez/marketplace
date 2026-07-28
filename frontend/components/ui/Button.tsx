import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from '../../lib/clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'brass';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:shadow-lg active:scale-[0.98] dark:bg-paper dark:text-ink',
  secondary:
    'bg-surface text-ink border border-line hover:border-ink/30 hover:shadow-sm active:scale-[0.98]',
  ghost: 'text-ink hover:bg-ink/5 active:scale-[0.98]',
  brass:
    'bg-brass text-white hover:shadow-[0_8px_24px_-4px_rgba(192,138,62,0.45)] active:scale-[0.98]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-md',
  md: 'h-11 px-5 text-[0.9375rem] rounded-md',
  lg: 'h-14 px-7 text-base rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-fast ease-out-expo',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
