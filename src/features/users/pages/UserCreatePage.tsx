import { UserForm } from '../components/UserForm';

export function UserCreatePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create User</h1>
      <UserForm mode="create" />
    </div>
  );
}
