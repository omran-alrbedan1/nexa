import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

const badgeVariants = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-gray-100 text-gray-800',
  orange: 'bg-orange-100 text-orange-800',
  indigo: 'bg-indigo-100 text-indigo-800',
} as const;

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
} as const;

interface BadgeProps {
  variant?: keyof typeof badgeVariants;
  size?: keyof typeof sizeStyles;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

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
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        badgeVariants[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'green' ? 'bg-green-500' :
            variant === 'red' ? 'bg-red-500' :
            variant === 'yellow' ? 'bg-yellow-500' :
            variant === 'blue' ? 'bg-blue-500' :
            variant === 'purple' ? 'bg-purple-500' :
            variant === 'orange' ? 'bg-orange-500' :
            'bg-gray-500'
          )}
        />
      )}
      {children}
    </span>
  );
}
