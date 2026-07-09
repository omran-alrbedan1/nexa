import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNavConfigStore } from '@/stores/navConfigStore';
import { DEFAULT_NAV_CONFIG, ICON_MAP, resolveLabel } from '@/config/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import {
  ArrowLeft, Menu, Pencil, Check, X, ChevronUp, ChevronDown, RotateCcw,
} from 'lucide-react';

interface EditingField {
  id: string;
  value: string;
}

function getDefaultLabel(id: string): string {
  for (const group of DEFAULT_NAV_CONFIG) {
    if (group.id === id) return group.label;
    const item = group.items.find((i) => i.id === id);
    if (item) return item.label;
  }
  return id;
}

export function SettingsNavigationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const customLabels = useNavConfigStore((s) => s.customLabels);
  const groupOrder = useNavConfigStore((s) => s.groupOrder);
  const itemOrder = useNavConfigStore((s) => s.itemOrder);
  const moveGroup = useNavConfigStore((s) => s.moveGroup);
  const moveItem = useNavConfigStore((s) => s.moveItem);
  const setCustomLabel = useNavConfigStore((s) => s.setCustomLabel);
  const resetToDefaults = useNavConfigStore((s) => s.resetToDefaults);
  const isDefault = useNavConfigStore((s) => s.isDefault);

  const [editing, setEditing] = useState<EditingField | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = (id: string, currentLabel: string) => {
    setEditing({ id, value: currentLabel });
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  const confirmEdit = () => {
    if (!editing) return;
    if (editing.value.trim()) {
      setCustomLabel(editing.id, editing.value.trim());
    }
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleReset = () => {
    resetToDefaults();
    addToast('success', 'Navigation reset to defaults');
  };

  const orderedGroups = groupOrder
    .map((gid) => DEFAULT_NAV_CONFIG.find((g) => g.id === gid)!)
    .filter(Boolean);

  const renderLabel = (id: string, defaultLabel: string) => {
    const isEditing = editing?.id === id;
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          value={editing.value}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onKeyDown={handleKeyDown}
          onBlur={confirmEdit}
          className="flex-1 min-w-0 px-2 py-1 text-sm border border-brand-primary rounded-md outline-none bg-white font-body"
          dir="auto"
        />
      );
    }
    return (
      <span className="truncate">{resolveLabel(id, defaultLabel, customLabels, t)}</span>
    );
  };

  const renderActions = (id: string, onMoveUp: (() => void) | null, onMoveDown: (() => void) | null) => {
    const isEditing = editing?.id === id;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <button onClick={confirmEdit} className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors" title="Save">
            <Check size={14} />
          </button>
          <button onClick={cancelEdit} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors" title="Cancel">
            <X size={14} />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => startEdit(id, resolveLabel(id, getDefaultLabel(id), customLabels, t))}
          className="p-1.5 rounded-md text-text-secondary hover:bg-brand-primary-light hover:text-brand-primary transition-colors"
          title="Rename"
        >
          <Pencil size={14} />
        </button>
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            className="p-1.5 rounded-md text-text-secondary hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <ChevronUp size={14} />
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            className="p-1.5 rounded-md text-text-secondary hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-4xl">
      <button
        onClick={() => navigate(ROUTES.SETTINGS)}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body"
      >
        <ArrowLeft size={16} /> Back to Settings
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Menu size={22} className="text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">Navigation Menu</h1>
              <p className="text-sm text-text-secondary font-body">Reorder and rename sidebar navigation items</p>
            </div>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">Sidebar Structure</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">Drag to reorder, click to rename. Changes save automatically.</p>
          </div>
          {!isDefault() && (
            <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={14} />} onClick={handleReset}>
              Reset to Defaults
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {orderedGroups.map((group, groupIdx) => {
            const Icon = ICON_MAP[group.icon];
            const orderedItemIds = itemOrder[group.id] || group.items.map((i) => i.id);
            const orderedItems = orderedItemIds
              .map((iid) => group.items.find((i) => i.id === iid)!)
              .filter(Boolean);

            return (
              <div key={group.id} className="rounded-xl border border-border-default overflow-hidden">
                {/* Group header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-border-default">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {Icon && <Icon size={16} className="text-text-secondary flex-shrink-0" />}
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex-shrink-0">Group:</span>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {renderLabel(group.id, group.label)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {renderActions(
                      group.id,
                      groupIdx > 0 ? () => moveGroup(group.id, 'up') : null,
                      groupIdx < orderedGroups.length - 1 ? () => moveGroup(group.id, 'down') : null,
                    )}
                  </div>
                </div>

                {/* Items within group */}
                <div className="divide-y divide-border-default/40">
                  {orderedItems.map((item, itemIdx) => {
                    const ItemIcon = ICON_MAP[item.icon];
                    return (
                      <div key={item.id} className="flex items-center justify-between px-4 py-2.5 pl-10">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {ItemIcon && <ItemIcon size={16} className="text-text-tertiary flex-shrink-0" />}
                          {renderLabel(item.id, item.label)}
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          {renderActions(
                            item.id,
                            itemIdx > 0 ? () => moveItem(group.id, item.id, 'up') : null,
                            itemIdx < orderedItems.length - 1 ? () => moveItem(group.id, item.id, 'down') : null,
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
