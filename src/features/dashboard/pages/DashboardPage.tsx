import { useAuth } from '@/contexts/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">
        Welcome back, <span className="font-semibold">{user?.name}</span>!
      </p>
    </div>
  );
}
