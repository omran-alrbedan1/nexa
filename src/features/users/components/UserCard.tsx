import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { cn } from '@/utils/cn';
import type { User } from '../types/userTypes';

interface UserCardProps {
  user: User;
  selected?: boolean;
  onSelectChange?: (userId: number, selected: boolean) => void;
  onDelete: (userId: number) => void;
  isDeleting?: boolean;
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  operations: 'bg-indigo-100 text-indigo-800',
  aggregation: 'bg-green-100 text-green-800',
  supplier: 'bg-orange-100 text-orange-800',
  driver: 'bg-yellow-100 text-yellow-800',
  customer: 'bg-blue-100 text-blue-800',
};

export function UserCard({ user, selected, onSelectChange, onDelete, isDeleting }: UserCardProps) {
  return (
    <div className={cn('bg-white rounded-lg border p-4 transition-shadow', selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:shadow-md')}>
      <div className="flex items-start gap-3">
        {onSelectChange && (
          <div className="pt-1">
            <input
              type="checkbox"
              checked={!!selected}
              onChange={(e) => onSelectChange(user.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              aria-label={`Select ${user.name}`}
            />
          </div>
        )}
        <div className="flex-1">
          <Link
            to={ROUTES.USER_DETAIL(user.id)}
            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
          >
            {user.name}
          </Link>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                roleColors[user.role] || roleColors.viewer
              )}
            >
              {user.role}
            </span>
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                user.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              )}
            >
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.USER_DETAIL(user.id)}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            View
          </Link>
          <Link
            to={ROUTES.USER_EDIT(user.id)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => onDelete(user.id)}
            disabled={isDeleting}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          >
            {isDeleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
