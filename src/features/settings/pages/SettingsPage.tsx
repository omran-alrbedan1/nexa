import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ROUTES } from '@/routes/routes';
import { useDeleteAccount } from '../hooks/useDeleteAccount';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteAccount = useDeleteAccount();
  const deleteDialog = useConfirmDialog();

  const handleDeleteAccount = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        navigate(ROUTES.LOGIN);
      },
    });
    deleteDialog.close();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Profile section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <dl className="space-y-3">
          <div className="flex">
            <dt className="text-sm font-medium text-gray-500 w-24">Name</dt>
            <dd className="text-sm text-gray-900">{user?.name}</dd>
          </div>
          <div className="flex">
            <dt className="text-sm font-medium text-gray-500 w-24">Email</dt>
            <dd className="text-sm text-gray-900">{user?.email}</dd>
          </div>
          <div className="flex">
            <dt className="text-sm font-medium text-gray-500 w-24">Role</dt>
            <dd className="text-sm text-gray-900 capitalize">{user?.role}</dd>
          </div>
        </dl>
      </section>

      {/* Danger zone */}
      <section className="bg-white rounded-lg border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => deleteDialog.open()}
          disabled={deleteAccount.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {deleteAccount.isPending ? 'Deleting...' : 'Delete my account'}
        </button>
      </section>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        title="Delete account"
        message={
          <>
            Are you sure you want to delete your account? This will permanently remove{' '}
            <span className="font-semibold text-gray-900">{user?.name}</span>'s account
            and all associated data. You will be signed out immediately.
          </>
        }
        confirmLabel="Delete account"
        variant="danger"
        isLoading={deleteAccount.isPending}
        onConfirm={handleDeleteAccount}
        onCancel={deleteDialog.close}
      />
    </div>
  );
}
