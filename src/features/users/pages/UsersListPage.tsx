import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { useUsers } from '../hooks/useUsers';
import { useDeleteUser } from '../hooks/useDeleteUser';
import { useBulkDeleteUsers } from '../hooks/useBulkDeleteUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserList } from '../components/UserList';
import type { User } from '../types/userTypes';

export function UsersListPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const singleDelete = useConfirmDialog<User>();
  const {
    open: openBulkDelete,
    close: closeBulkDelete,
    isOpen: isBulkDeleteOpen,
  } = useConfirmDialog();

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useUsers({
    page,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  });

  const deleteMutation = useDeleteUser();
  const bulkDeleteMutation = useBulkDeleteUsers();

  const handleDeleteRequest = (userId: number) => {
    const user = data?.data.find((u) => u.id === userId);
    if (user) singleDelete.open(user);
  };

  const handleSelectChange = useCallback((userId: number, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }, []);

  const handleBulkDeleteConfirm = useCallback(() => {
    if (selectedIds.size === 0) return;
    bulkDeleteMutation.mutate(Array.from(selectedIds), {
      onSuccess: () => setSelectedIds(new Set()),
    });
    closeBulkDelete();
  }, [selectedIds, bulkDeleteMutation, closeBulkDelete]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={() => openBulkDelete()}
              disabled={bulkDeleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {bulkDeleteMutation.isPending
                ? 'Deleting...'
                : `Delete Selected (${selectedIds.size})`}
            </button>
          )}
          <Link
            to={ROUTES.USER_CREATE}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create User
          </Link>
        </div>
      </div>

      <UserList
        users={data?.data ?? []}
        pagination={data?.meta}
        isLoading={isLoading}
        isDeleting={deleteMutation.isPending || bulkDeleteMutation.isPending}
        error={error}
        search={search}
        roleFilter={roleFilter}
        selectedIds={selectedIds}
        onSelectChange={handleSelectChange}
        onClearSelection={() => setSelectedIds(new Set())}
        onSearchChange={(v) => { setSearch(v); setPage(1); setSelectedIds(new Set()); }}
        onRoleFilterChange={(v) => { setRoleFilter(v); setPage(1); setSelectedIds(new Set()); }}
        onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
        onDeleteUser={handleDeleteRequest}
      />

      {/* Single delete dialog */}
      <ConfirmDialog
        open={singleDelete.isOpen}
        title="Delete User"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">{singleDelete.data?.name}</span>?
            <br />
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!singleDelete.data) return;
          deleteMutation.mutate(singleDelete.data.id);
          singleDelete.close();
        }}
        onCancel={singleDelete.close}
      />

      {/* Bulk delete dialog */}
      <ConfirmDialog
        open={isBulkDeleteOpen}
        title="Delete Users"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">{selectedIds.size} user{selectedIds.size === 1 ? '' : 's'}</span>?
            <br />
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={bulkDeleteMutation.isPending}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={closeBulkDelete}
      />
    </div>
  );
}
