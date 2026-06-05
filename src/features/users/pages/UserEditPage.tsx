import { useParams, Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { useUser } from '../hooks/useUser';
import { UserForm } from '../components/UserForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function UserEditPage() {
  const { userId } = useParams<{ userId: string }>();
  const id = userId ? Number(userId) : undefined;
  const { data, isLoading, error } = useUser(id);

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>
      <UserForm mode="edit" user={data.data} />
    </div>
  );
}
