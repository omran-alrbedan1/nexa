import { memo, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ListItemProps {
  onClick?: () => void;
  icon: ReactNode;
  iconClassName?: string;
  hideIconOnMobile?: boolean;
  title: ReactNode;
  badges?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const ListItem = memo(function ListItem({
  onClick,
  icon,
  iconClassName,
  hideIconOnMobile,
  title,
    badges,
  children,
  actions,
  className,
}: ListItemProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-9 h-9 rounded-xl bg-brand-primary-light flex items-center justify-center flex-shrink-0',
              hideIconOnMobile && 'hidden sm:flex',
              iconClassName
            )}>
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {title}
                {badges}
              </div>
            </div>
          </div>
          <div className="ml-11 mt-2">
            {children}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0 w-full sm:w-auto justify-end flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});
