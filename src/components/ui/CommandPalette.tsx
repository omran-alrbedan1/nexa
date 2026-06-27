import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/routes/routes';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard, ClipboardList, Truck, Warehouse, Users,
  Map, Megaphone, Package, Settings2, CreditCard, LifeBuoy,
  BarChart3, FileClock, type LucideIcon, Search, Command, ArrowRight,
} from 'lucide-react';

// ── Page Entries ──

interface PageEntry {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  keywords: string[];
  roles?: Array<'admin' | 'operations' | 'aggregation'>;
}

const ALL_PAGES: PageEntry[] = [
  { id: 'dashboard', label: 'nav.dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard, keywords: ['home', 'main', 'overview'] },
  { id: 'operations', label: 'nav.operations', to: ROUTES.OPERATIONS, icon: ClipboardList, keywords: ['ops', 'orders', 'special', 'complaints'], roles: ['operations'] },
  { id: 'orders', label: 'nav.orders', to: ROUTES.ORDERS, icon: ClipboardList, keywords: ['all orders', 'list', 'payments'], roles: ['admin', 'operations'] },
  { id: 'trips', label: 'nav.trips', to: ROUTES.TRIPS, icon: Truck, keywords: ['delivery', 'routes', 'drivers', 'schedule'], roles: ['admin', 'operations'] },
  { id: 'warehouse', label: 'nav.warehouse', to: ROUTES.AGGREGATION, icon: Warehouse, keywords: ['storage', 'inventory', 'supply', 'shipping', 'aggregation'], roles: ['admin', 'aggregation'] },
  { id: 'suppliers', label: 'nav.suppliers', to: ROUTES.SUPPLIERS, icon: Users, keywords: ['vendors', 'providers', 'partners'], roles: ['admin'] },
  { id: 'regions', label: 'nav.regions', to: ROUTES.REGIONS, icon: Map, keywords: ['zones', 'areas', 'locations', 'clusters', 'slots'], roles: ['admin', 'operations'] },
  { id: 'campaigns', label: 'nav.campaigns', to: ROUTES.CAMPAIGNS, icon: Megaphone, keywords: ['seasonal', 'promotions', 'marketing'], roles: ['admin', 'operations'] },
  { id: 'products', label: 'nav.products', to: ROUTES.PRODUCTS, icon: Package, keywords: ['items', 'catalog', 'inventory', 'stock'], roles: ['admin', 'operations'] },
  { id: 'reports', label: 'nav.reports', to: ROUTES.REPORTS, icon: BarChart3, keywords: ['analytics', 'statistics', 'data', 'charts'], roles: ['admin'] },
  { id: 'customers', label: 'nav.customers', to: ROUTES.CUSTOMERS, icon: Users, keywords: ['clients', 'users', 'accounts'], roles: ['admin', 'operations'] },
  { id: 'payments', label: 'nav.payments', to: ROUTES.PAYMENTS, icon: CreditCard, keywords: ['transactions', 'refunds', 'billing'], roles: ['admin'] },
  { id: 'support', label: 'nav.support', to: ROUTES.SUPPORT_TICKETS, icon: LifeBuoy, keywords: ['tickets', 'help', 'complaints'], roles: ['admin', 'operations'] },
  { id: 'specialOrders', label: 'nav.specialOrders', to: ROUTES.SPECIAL_ORDERS, icon: FileClock, keywords: ['special', 'requests', 'custom', 'pricing', 'quotes'], roles: ['admin', 'operations'] },
  { id: 'settings', label: 'nav.settings', to: ROUTES.SETTINGS, icon: Settings2, keywords: ['configuration', 'preferences', 'roles', 'staff', 'banners'], roles: ['admin'] },
];

// ── Props ──

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  userRole?: string;
}

// ── Component ──

export function CommandPalette({ open, onClose, userRole = 'admin' }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Filter pages by query and user role
  const filteredPages = ALL_PAGES.filter((page) => {
    if (page.roles && (!userRole || !page.roles.includes(userRole as 'admin' | 'operations' | 'aggregation'))) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const label = t(page.label).toLowerCase();
    const keywords = page.keywords.map((k) => k.toLowerCase());
    return label.includes(q) || keywords.some((k) => k.includes(q));
  });

  // Reset selection when results change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIdx] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  const navigateTo = useCallback((to: string) => {
    navigate(to);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, filteredPages.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPages[selectedIdx]) {
          navigateTo(filteredPages[selectedIdx].to);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-border-default overflow-hidden animate-fade-up">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border-default">
          <Search size={18} className="text-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('app.commandPlaceholder')}
            className="flex-1 text-sm font-body text-text-primary outline-none bg-transparent placeholder:text-text-tertiary"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono text-text-tertiary bg-bg-section-alt rounded-md border border-border-default">
            <Command size={12} />K
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-72 overflow-y-auto custom-scrollbar py-2"
        >
          {filteredPages.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Search size={24} className="mx-auto text-text-tertiary opacity-40 mb-2" />
              <p className="text-sm text-text-secondary font-body">{t('app.commandEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {filteredPages.map((page, idx) => {
                const Icon = page.icon;
                return (
                  <button
                    key={page.id}
                    onClick={() => navigateTo(page.to)}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all text-left',
                      idx === selectedIdx
                        ? 'bg-brand-primary-light text-brand-primary font-bold'
                        : 'text-text-secondary hover:bg-bg-section-alt'
                    )}
                  >
                    <span className={cn(
                      'flex-shrink-0',
                      idx === selectedIdx ? 'text-brand-primary' : 'text-text-tertiary'
                    )}>
                      <Icon size={18} />
                    </span>
                    <span className="flex-1">{t(page.label)}</span>
                    <ArrowRight
                      size={14}
                      className={cn(
                        'flex-shrink-0 transition-opacity',
                        idx === selectedIdx ? 'opacity-100 text-brand-primary' : 'opacity-0'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border-default bg-bg-section-alt/50">
          <div className="flex items-center gap-3 text-[11px] text-text-tertiary font-body">
            <span className="flex items-center gap-1">↑↓ <span className="text-text-tertiary">Navigate</span></span>
            <span className="flex items-center gap-1">↵ <span className="text-text-tertiary">Open</span></span>
            <span className="flex items-center gap-1">Esc <span className="text-text-tertiary">Close</span></span>
          </div>
          <span className="text-[11px] text-text-tertiary font-body">{filteredPages.length} results</span>
        </div>
      </div>
    </div>
  );
}

// ── Hook to manage global keyboard shortcut ──

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
}
