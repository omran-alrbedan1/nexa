import { UserCard } from './UserCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { User } from '../types/userTypes';

interface UserListProps {
  users: User[];
  pagination?: {
    currentPage: number;
    lastPage: number;
    total: number;
  };
  isLoading: boolean;
  isDeleting: boolean;
  error: Error | null;
  search: string;
  roleFilter: string;
  selectedIds?: Set<number>;
  onSelectChange?: (userId: number, selected: boolean) => void;
  onClearSelection?: () => void;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onDeleteUser: (userId: number) => void;
}

export function UserList({
  users,
  pagination,
  isLoading,
  isDeleting,
  error,
  search,
  roleFilter,
  selectedIds,
  onSelectChange,
  onClearSelection,
  onSearchChange,
  onRoleFilterChange,
  onPageChange,
  onDeleteUser,
}: UserListProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
        Failed to load users: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters + bulk actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="operations">Operations</option>
          <option value="aggregation">Warehouse</option>
          <option value="supplier">Supplier</option>
          <option value="driver">Driver</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {/* Bulk selection bar */}
      {onSelectChange && selectedIds && selectedIds.size > 0 && !isLoading && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
          <span className="text-sm text-blue-800 font-medium">
            {selectedIds.size} user{selectedIds.size === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No users found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* User cards */}
      {!isLoading && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              selected={selectedIds?.has(user.id)}
              onSelectChange={onSelectChange}
              onDelete={onDeleteUser}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.lastPage}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
