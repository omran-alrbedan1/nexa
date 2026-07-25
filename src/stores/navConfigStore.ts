import { create } from 'zustand';
import { DEFAULT_NAV_CONFIG } from '@/config/navigation';

const STORAGE_KEY = 'nexa-nav-config';

interface PersistedNavData {
  customLabels: Record<string, string>;
  groupOrder: string[];
  itemOrder: Record<string, string[]>;
}

function loadPersisted(): PersistedNavData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function savePersisted(data: PersistedNavData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function getDefaultGroupOrder(): string[] {
  return DEFAULT_NAV_CONFIG.map((g) => g.id);
}

function getDefaultItemOrder(): Record<string, string[]> {
  const order: Record<string, string[]> = {};
  for (const group of DEFAULT_NAV_CONFIG) {
    order[group.id] = group.items.map((i) => i.id);
  }
  return order;
}

/**
 * Merge persisted group order with defaults so new nav groups (added after initial persist)
 * are not silently dropped. Default groups are appended at the end if missing from persisted.
 */
function mergeGroupOrder(
  persisted: string[] | undefined,
  defaults: string[]
): string[] {
  if (!persisted) return defaults;
  const existingSet = new Set(persisted);
  const missing = defaults.filter((id) => !existingSet.has(id));
  return [...persisted, ...missing];
}

/**
 * Merge persisted item order with defaults so new nav items (added after initial persist)
 * are not silently dropped. Default items are appended at the end if missing from persisted.
 */
function mergeItemOrder(
  persisted: Record<string, string[]> | undefined,
  defaults: Record<string, string[]>
): Record<string, string[]> {
  if (!persisted) return defaults;
  const merged: Record<string, string[]> = {};
  for (const groupId of Object.keys(defaults)) {
    const defaultItems = defaults[groupId];
    const persistedItems = persisted[groupId] ?? [];
    const existingSet = new Set(persistedItems);
    const missing = defaultItems.filter((id) => !existingSet.has(id));
    merged[groupId] = [...persistedItems, ...missing];
  }
  return merged;
}

export interface NavConfigStore {
  customLabels: Record<string, string>;
  groupOrder: string[];
  itemOrder: Record<string, string[]>;
  expandedGroups: string[];

  setCustomLabel: (id: string, label: string) => void;
  moveGroup: (id: string, direction: 'up' | 'down') => void;
  moveItem: (groupId: string, itemId: string, direction: 'up' | 'down') => void;
  toggleExpanded: (id: string) => void;
  resetToDefaults: () => void;
  isDefault: () => boolean;
}

function isDefaultState(state: Pick<PersistedNavData, 'customLabels' | 'groupOrder' | 'itemOrder'>): boolean {
  if (Object.keys(state.customLabels).length > 0) return false;
  const defaultGroupOrder = getDefaultGroupOrder();
  const defaultItemOrder = getDefaultItemOrder();
  if (JSON.stringify(state.groupOrder) !== JSON.stringify(defaultGroupOrder)) return false;
  if (JSON.stringify(state.itemOrder) !== JSON.stringify(defaultItemOrder)) return false;
  return true;
}

export function isNavDefault(): boolean {
  const persisted = loadPersisted();
  if (!persisted) return true;
  return isDefaultState(persisted);
}

export const useNavConfigStore = create<NavConfigStore>((set, get) => {
  const persisted = loadPersisted();

  return {
    customLabels: persisted?.customLabels ?? {},
    groupOrder: mergeGroupOrder(persisted?.groupOrder, getDefaultGroupOrder()),
    itemOrder: mergeItemOrder(persisted?.itemOrder, getDefaultItemOrder()),
    expandedGroups: [],

    setCustomLabel: (id, label) => {
      set((state) => {
        const next = { ...state.customLabels, [id]: label };
        if (!label.trim()) delete next[id];
        const newState = { ...state, customLabels: next };
        savePersisted({
          customLabels: next,
          groupOrder: state.groupOrder,
          itemOrder: state.itemOrder,
        });
        return newState;
      });
    },

    moveGroup: (id, direction) => {
      set((state) => {
        const idx = state.groupOrder.indexOf(id);
        if (idx === -1) return state;
        const newOrder = [...state.groupOrder];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= newOrder.length) return state;
        [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
        const newState = { ...state, groupOrder: newOrder };
        savePersisted({
          customLabels: state.customLabels,
          groupOrder: newOrder,
          itemOrder: state.itemOrder,
        });
        return newState;
      });
    },

    moveItem: (groupId, itemId, direction) => {
      set((state) => {
        const currentOrder = state.itemOrder[groupId];
        if (!currentOrder) return state;
        const idx = currentOrder.indexOf(itemId);
        if (idx === -1) return state;
        const newOrder = [...currentOrder];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= newOrder.length) return state;
        [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
        const newItemOrder = { ...state.itemOrder, [groupId]: newOrder };
        const newState = { ...state, itemOrder: newItemOrder };
        savePersisted({
          customLabels: state.customLabels,
          groupOrder: state.groupOrder,
          itemOrder: newItemOrder,
        });
        return newState;
      });
    },

    toggleExpanded: (id) => {
      set((state) => {
        const isExpanded = state.expandedGroups.includes(id);
        const next = isExpanded
          ? state.expandedGroups.filter((g) => g !== id)
          : [...state.expandedGroups, id];
        return { ...state, expandedGroups: next };
      });
    },

    resetToDefaults: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({
        customLabels: {},
        groupOrder: getDefaultGroupOrder(),
        itemOrder: getDefaultItemOrder(),
        expandedGroups: [],
      });
    },

    isDefault: () => {
      return isDefaultState({
        customLabels: get().customLabels,
        groupOrder: get().groupOrder,
        itemOrder: get().itemOrder,
      });
    },
  };
});
