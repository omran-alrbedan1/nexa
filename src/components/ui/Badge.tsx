import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

const badgeVariants = {
  teal: 'bg-brand-primary-light text-brand-primary-dark',
  coral: 'bg-brand-accent-light text-brand-accent-dark',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-amber-50 text-amber-700',
  purple: 'bg-purple-50 text-purple-700',
  gray: 'bg-gray-100 text-text-secondary',
  white: 'bg-white text-text-primary border border-border-default',
} as const;

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
} as const;

interface BadgeProps {
  variant?: keyof typeof badgeVariants;
  size?: keyof typeof sizeStyles;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const dotColors: Record<string, string> = {
  teal: 'bg-brand-primary',
  coral: 'bg-brand-accent',
  green: 'bg-status-success',
  red: 'bg-status-error',
  yellow: 'bg-status-warning',
  purple: 'bg-purple-500',
  gray: 'bg-text-tertiary',
  white: 'bg-text-tertiary',
};

export function Badge({
  variant = 'gray',
  size = 'md',
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-full font-body uppercase tracking-wider',
        badgeVariants[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
