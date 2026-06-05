import { useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface Tab {
  id: string;
  label: string;
  badge?: number | string;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
  children?: ReactNode;
}

export function Tabs({
  tabs,
  activeTab: externalActiveTab,
  onChange,
  variant = 'underline',
  className,
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id);
  const activeTab = externalActiveTab ?? internalActiveTab;

  const handleChange = (tabId: string) => {
    setInternalActiveTab(tabId);
    onChange(tabId);
  };

  return (
    <div className={cn('flex', variant === 'underline' ? 'border-b border-gray-200' : 'gap-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors',
            variant === 'underline'
              ? cn(
                  'px-4 py-3 border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )
              : cn(
                  'px-4 py-2 rounded-lg',
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                ),
            tab.disabled && 'opacity-50 cursor-not-allowed'
          )}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full',
                activeTab === tab.id
                  ? variant === 'underline'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-blue-200 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
