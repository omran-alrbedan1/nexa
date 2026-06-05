import { cn } from '@/utils/cn';

type StatusColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange' | 'indigo';

interface StatusBadgeProps {
  status: string;
  color?: StatusColor;
  dot?: boolean;
  className?: string;
}

const colorMap: Record<StatusColor, { bg: string; text: string; dot: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  green: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  red: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
};

export function StatusBadge({
  status,
  color = 'gray',
  dot = true,
  className,
}: StatusBadgeProps) {
  const colors = colorMap[color];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        colors.bg,
        colors.text,
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />}
      {status}
    </span>
  );
}

/**
 * Convenience function to determine status color based on common patterns.
 * Override with explicit color prop when needed.
 */
export function getStatusColor(status: string): StatusColor {
  const lower = status.toLowerCase();

  if (lower.includes('success') || lower.includes('active') || lower.includes('delivered') || lower.includes('completed') || lower.includes('paid')) {
    return 'green';
  }
  if (lower.includes('error') || lower.includes('failed') || lower.includes('cancelled') || lower.includes('inactive') || lower.includes('suspended')) {
    return 'red';
  }
  if (lower.includes('pending') || lower.includes('waiting') || lower.includes('processing') || lower.includes('review') || lower.includes('hold')) {
    return 'yellow';
  }
  if (lower.includes('shipped') || lower.includes('shipping') || lower.includes('out_for') || lower.includes('ready') || lower.includes('confirmed')) {
    return 'blue';
  }
  if (lower.includes('special') || lower.includes('custom') || lower.includes('premium')) {
    return 'purple';
  }
  if (lower.includes('refund') || lower.includes('return')) {
    return 'orange';
  }

  return 'gray';
}
