import { useState, useCallback } from 'react';

/**
 * Manages confirmation dialog state.
 *
 * For simple boolean dialogs (no associated data):
 * ```ts
 * const dialog = useConfirmDialog();
 * // dialog.open() — opens the dialog
 * // dialog.close() — closes it
 * // dialog.isOpen — boolean
 * ```
 *
 * For dialogs with associated data (e.g. which user to delete):
 * ```ts
 * const dialog = useConfirmDialog<User>();
 * // dialog.open(user) — opens with user as dialog.data
 * // dialog.close() — clears data and closes
 * // dialog.isOpen — boolean
 * // dialog.data — User | null
 * ```
 */
export function useConfirmDialog<T = void>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((d: T) => {
    setData(d as T);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setData(null);
    setIsOpen(false);
  }, []);

  return { isOpen, data, open, close } as const;
}
