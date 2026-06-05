import { useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { useUser } from '../hooks/useUser';
import { useDeleteUser } from '../hooks/useDeleteUser';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const id = userId ? Number(userId) : undefined;
  const navigate = useNavigate();
  const { data, isLoading, error } = useUser(id);
  const deleteMutation = useDeleteUser();
  const { open: openDeleteDialog, close: closeDeleteDialog, isOpen: isDeleteDialogOpen } = useConfirmDialog();

  const handleDelete = useCallback(() => {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => navigate(ROUTES.USERS),
    });
    closeDeleteDialog();
  }, [id, deleteMutation, navigate, closeDeleteDialog]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load user.</p>
        <Link to={ROUTES.USERS} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to users
        </Link>
      </div>
    );
  }

  const user = data.data;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openDeleteDialog()}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleteMutation.isPending ? '...' : 'Delete'}
          </button>
          <Link
            to={ROUTES.USER_EDIT(user.id)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit User
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        <div className="flex items-center px-6 py-4">
          <span className="text-sm font-medium text-gray-500 w-32">ID</span>
          <span className="text-sm text-gray-900">{user.id}</span>
        </div>
        <div className="flex items-center px-6 py-4">
          <span className="text-sm font-medium text-gray-500 w-32">Name</span>
          <span className="text-sm text-gray-900">{user.name}</span>
        </div>
        <div className="flex items-center px-6 py-4">
          <span className="text-sm font-medium text-gray-500 w-32">Email</span>
          <span className="text-sm text-gray-900">{user.email}</span>
        </div>
        <div className="flex items-center px-6 py-4">
          <span className="text-sm font-medium text-gray-500 w-32">Role</span>
          <span className="text-sm text-gray-900 capitalize">{user.role}</span>
        </div>
        <div className="flex items-center px-6 py-4">
          <span className="text-sm font-medium text-gray-500 w-32">Status</span>
          <span className={`text-sm ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center px-6 py-4">
          <span className="text-sm font-medium text-gray-500 w-32">Created</span>
          <span className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mt-4">
        <Link to={ROUTES.USERS} className="text-sm text-blue-600 hover:underline">
          ← Back to users
        </Link>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Delete User"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">{user.name}</span>?
            <br />
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}
