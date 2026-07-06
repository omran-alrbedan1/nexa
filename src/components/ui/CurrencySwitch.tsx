import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useCurrencyStore, CURRENCY_META, type CurrencyCode } from '@/stores/currencyStore';

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'USD', label: 'Dollar', symbol: '$' },
  { code: 'ILS', label: 'Shekel', symbol: '₪' },
  { code: 'AED', label: 'Dirham', symbol: 'د.إ' },
];

export function CurrencySwitch() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  const current = CURRENCY_META[selectedCurrency];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary rounded-md transition-colors"
        title="Currency"
      >
        <span className="uppercase tracking-wider">{current.symbol}</span>
        <span className="uppercase tracking-wider">{selectedCurrency}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-border-default shadow-lg z-50 py-1 animate-fade-up">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-body transition-colors hover:bg-bg-section-alt
                ${c.code === selectedCurrency ? 'text-brand-primary font-bold' : 'text-text-primary'}
              `}
            >
              <span className="w-5 text-center">{c.symbol}</span>
              <span className="flex-1 text-left">{c.label}</span>
              {c.code === selectedCurrency && (
                <Check size={14} className="text-brand-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
