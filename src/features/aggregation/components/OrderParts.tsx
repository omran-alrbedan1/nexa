import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Layers2 } from 'lucide-react';
import type { OrderPart } from '../api/aggregationApi';

interface OrderPartsProps {
  members: OrderPart[];
  progressLabel: string;
  renderMember?: (part: OrderPart) => ReactNode;
  defaultOpen?: boolean;
}

export function OrderParts({ members, progressLabel, renderMember, defaultOpen = false }: OrderPartsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  if (members.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
          <Layers2 size={12} className="flex-shrink-0" />
          {progressLabel}
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 transition-colors"
        >
          {open ? t('warehouse.parts.hideParts') : t('warehouse.parts.showParts')}
          <span className="text-purple-400">({members.length})</span>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {open && (
        <div className="mt-1.5 rounded-lg border border-purple-100 bg-purple-50/40 divide-y divide-purple-100">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
              <div className="min-w-0">
                <span className="font-medium text-gray-800">{member.supplierName || `#${member.id}`}</span>
                <span className="text-gray-400 ml-1.5">{member.orderNumber}</span>
              </div>
              {renderMember ? (
                <div className="flex items-center gap-2 flex-shrink-0">{renderMember(member)}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}