import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { createUserSchema, updateUserSchema } from '../schemas/userSchema';
import { useCreateUser } from '../hooks/useCreateUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import type { User } from '../types/userTypes';

// Covers all fields that could appear in either create or edit form
interface UserFormFields {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'operations' | 'aggregation' | 'supplier' | 'driver' | 'customer';
  isActive?: boolean;
}

interface CreateUserFormProps {
  mode: 'create';
}

interface EditUserFormProps {
  mode: 'edit';
  user: User;
}

type UserFormProps = CreateUserFormProps | EditUserFormProps;

export function UserForm(props: UserFormProps) {
  const navigate = useNavigate();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const isEdit = props.mode === 'edit';
  const user = isEdit ? props.user : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormFields>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema) as any,
    defaultValues: isEdit
      ? { name: user!.name, email: user!.email, role: user!.role, isActive: user!.isActive }
      : { name: '', email: '', password: '', role: 'customer' },
  });

  const onSubmit = async (data: UserFormFields) => {
    try {
      if (isEdit) {
        const { password: _pw, ...dto } = data;
        await updateMutation.mutateAsync({ id: user!.id, dto });
      } else {
        await createMutation.mutateAsync(data as UserFormFields & { password: string });
      }
      navigate(ROUTES.USERS);
    } catch {
      // Error toast is already handled by the mutation's onError callback
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
        <input
          id="name"
          {...register('name')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
      </div>

      {!isEdit && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            aria-invalid={!!errors.password}
          />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">Role</label>
        <select
          id="role"
          {...register('role')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
          <option value="driver">Driver</option>
          <option value="aggregation">Warehouse</option>
          <option value="operations">Operations</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {isEdit && (
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium">Active</label>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting
            ? isEdit ? 'Saving...' : 'Creating...'
            : isEdit ? 'Save Changes' : 'Create User'}
        </button>
        <button
          type="button"
          onClick={() => navigate(ROUTES.USERS)}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
