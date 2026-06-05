# Users CRUD Feature — Complete Implementation Guide

> **Location:** `src/features/users/`  
> **Purpose:** Full CRUD (Create, Read, Update, Delete) with search, filter, pagination, optimistic deletes, and toast notifications  
> **Pattern:** Feature-based architecture — every CRUD feature follows the exact same structure

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Types — The "Model"](#2-types--the-model)
3. [Zod Schemas — Validation](#3-zod-schemas--validation)
4. [API Layer — The "Service"](#4-api-layer--the-service)
5. [Query Key Factory](#5-query-key-factory)
6. [Query Hooks — Reading Data](#6-query-hooks--reading-data)
7. [Mutation Hooks — Writing Data](#7-mutation-hooks--writing-data)
8. [Components](#8-components)
9. [Pages](#9-pages)
10. [Routes & Wiring](#10-routes--wiring)
11. [Toast Integration Pattern](#11-toast-integration-pattern)
12. [Architecture Diagram](#12-architecture-diagram)

---

## 1. Folder Structure

```
src/features/users/
├── api/
│   └── usersApi.ts            # HTTP calls (Service Layer)
├── components/
│   ├── UserCard.tsx           # Single user card (presentational)
│   ├── UserForm.tsx           # Create/Edit form (with React Hook Form + Zod)
│   └── UserList.tsx           # List with filters, pagination, states
├── hooks/
│   ├── useUsers.ts            # Paginated list query
│   ├── useUser.ts             # Single user query
│   ├── useCreateUser.ts       # Create mutation + toast
│   ├── useUpdateUser.ts       # Update mutation + toast
│   └── useDeleteUser.ts       # Delete mutation + optimistic update + toast
├── pages/
│   ├── UsersListPage.tsx      # List page (search, filter, paginate, delete)
│   ├── UserCreatePage.tsx     # Create page
│   ├── UserEditPage.tsx       # Edit page (pre-fetches user data)
│   └── UserDetailPage.tsx     # Detail page (read-only)
├── schemas/
│   └── userSchema.ts          # Zod validation schemas
└── types/
    └── userTypes.ts           # TypeScript interfaces
```

---

## 2. Types — The "Model"

```typescript
// src/features/users/types/userTypes.ts
// Pure TypeScript interfaces — the shape of the data from the API

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'editor' | 'viewer';
```

---

## 3. Zod Schemas — Validation

```typescript
// src/features/users/schemas/userSchema.ts
// Two schemas: one for create (all required), one for update (all optional)

import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
```

> **Key pattern:** `updateUserSchema` uses `.optional()` on every field instead of `.partial()` because it has the `isActive` field that doesn't exist in `createUserSchema`. This keeps the schemas decoupled.

---

## 4. API Layer — The "Service"

```typescript
// src/features/users/api/usersApi.ts
// Thin wrapper over axios — each method returns the unwrapped response data

import { apiClient } from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/common';
import type { User } from '../types/userTypes';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'viewer';
  isActive?: boolean;
}

export interface UserQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

const ENDPOINT = '/users';

export const usersApi = {
  list: (params?: UserQueryParams) =>
    apiClient.get<PaginatedResponse<User>>(ENDPOINT, { params }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<User>>(`${ENDPOINT}/${id}`).then((r) => r.data),

  create: (dto: CreateUserDto) =>
    apiClient.post<ApiResponse<User>>(ENDPOINT, dto).then((r) => r.data),

  update: (id: number, dto: UpdateUserDto) =>
    apiClient.put<ApiResponse<User>>(`${ENDPOINT}/${id}`, dto).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`${ENDPOINT}/${id}`).then((r) => r.data),
};
```

> **Pattern:** Each method calls `.then((r) => r.data)` to unwrap the Axios response. Components receive the actual data, not the Axios wrapper.
> **Naming:** `CreateUserDto` and `UpdateUserDto` are defined here alongside the API methods because they describe API request shapes, not UI form shapes.

---

## 5. Query Key Factory

```typescript
// src/features/users/hooks/useUsers.ts
// Centralized query key factory — every feature should have one

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UserQueryParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: number) => [...usersKeys.details(), id] as const,
};
```

> **Why a factory?** It prevents key collision across features and makes cache invalidation type-safe. Instead of remembering the magic string `['users', 'list', { page: 1 }]`, you call `usersKeys.list({ page: 1 })`. When you need to invalidate, `queryClient.invalidateQueries({ queryKey: usersKeys.lists() })` clears all list caches.

---

## 6. Query Hooks — Reading Data

### 6.1 `useUsers` — Paginated List

```typescript
export function useUsers(params: UserQueryParams = {}) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: (previousData) => previousData,  // keeps old data while fetching new
  });
}
```

> **`placeholderData`** prevents layout shift when page changes — the previous page's data stays visible until the new page loads.

### 6.2 `useUser` — Single Record

```typescript
export function useUser(id: number | undefined) {
  return useQuery<ApiResponse<User>>({
    queryKey: usersKeys.detail(id!),
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,  // don't fetch if id is undefined
  });
}
```

> **`enabled: !!id`** prevents the query from firing when the ID hasn't loaded yet (e.g., from route params).

---

## 7. Mutation Hooks — Writing Data

### 7.1 `useCreateUser` — Create + Toast

```typescript
export function useCreateUser() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      addToast('success', 'User created successfully');
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to create user');
      addToast('error', message);
    },
  });
}
```

### 7.2 `useUpdateUser` — Update + Toast

```typescript
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateUserDto }) => usersApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(variables.id) });
      addToast('success', 'User updated successfully');
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to update user');
      addToast('error', message);
    },
  });
}
```

### 7.3 `useDeleteUser` — Optimistic Delete + Toast

```typescript
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (userId: number) => usersApi.delete(userId),

    // OPTIMISTIC DELETE — remove from cache before server responds
    onMutate: async (userId: number) => {
      await queryClient.cancelQueries({ queryKey: usersKeys.lists() });
      const previousData = queryClient.getQueriesData({ queryKey: usersKeys.lists() });

      queryClient.setQueriesData({ queryKey: usersKeys.lists() }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('data' in (old as Record<string, unknown>))) return old;
        const typed = old as { data: Array<{ id: number }> };
        return { ...typed, data: typed.data.filter((u) => u.id !== userId) };
      });

      return { previousData };  // saved for rollback
    },

    onSuccess: () => {
      addToast('success', 'User deleted successfully');
    },

    onError: (err, _userId, context) => {
      // ROLLBACK — restore the cached data as it was before
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to delete user');
      addToast('error', message);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
```

> **Optimistic delete flow:**
> 1. `onMutate` — instantly removes the user from the cached list (UI updates immediately)
> 2. Server processes the delete
> 3a. `onSuccess` — shows success toast (cache is already correct)
> 3b. `onError` — restores the cached data (rollback) + shows error toast
> 4. `onSettled` — always refetches to ensure server-client sync

---

## 8. Components

### 8.1 `UserCard` — Presentational

Props: `user`, `onDelete`, `isDeleting?`

Renders a card with:
- Name (linked to detail page), email
- Role badge (color-coded: admin=purple, editor=blue, viewer=gray)
- Active/Inactive status badge (green/red)
- Action buttons: View, Edit, Delete

```typescript
// Key UI pattern — role-based colors with a lookup map
const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  editor: 'bg-blue-100 text-blue-800',
  viewer: 'bg-gray-100 text-gray-800',
};
```

### 8.2 `UserList` — Container with All States

Props: full list of state + event handlers

Handles four states:
- **Loading** — centered `<LoadingSpinner size="lg" />`
- **Error** — red alert banner with error message
- **Empty** — "No users found" message with hint to adjust filters
- **Data** — list of `UserCard` components

Includes filters:
- **Search input** — debounced text search
- **Role select** — dropdown filter (All / Admin / Editor / Viewer)

Includes **pagination** controls with Previous/Next buttons and "Page X of Y (Z total)" display.

### 8.3 `UserForm` — Combined Create/Edit

Uses a **discriminated union** pattern for props:

```typescript
interface CreateUserFormProps {
  mode: 'create';
}

interface EditUserFormProps {
  mode: 'edit';
  user: User;
}

type UserFormProps = CreateUserFormProps | EditUserFormProps;
```

Key behaviors:
- **Create mode:** Shows all fields including `password`. Uses `createUserSchema` for validation.
- **Edit mode:** Pre-fills values from the user object. Shows `isActive` checkbox. Uses `updateUserSchema` for validation. Strips `password` from submit data.
- **Submit:** Calls `mutateAsync()`, then navigates to `/users` on success. Errors are handled by the mutation's `onError` callback (toast notification).

---

## 9. Pages

### 9.1 `UsersListPage`

Orchestrates the list view:
- Manages `search`, `roleFilter`, and `page` state
- Debounces search (300ms)
- Resets to page 1 when search/filter changes
- Wires `useDeleteUser` mutation to the `onDelete` handler

### 9.2 `UserCreatePage`

Simple wrapper that renders `<UserForm mode="create" />`.

### 9.3 `UserEditPage`

Fetches user by ID from route params, then renders `<UserForm mode="edit" user={data.data} />`. Shows loading spinner while fetching and error state if the user can't be loaded.

### 9.4 `UserDetailPage`

Read-only detail view showing all user fields in a styled table layout. Includes "Edit User" button linking to the edit page.

---

## 10. Routes & Wiring

### Route Constants

```typescript
// src/routes/routes.ts
export const ROUTES = {
  USERS: '/users',
  USER_CREATE: '/users/create',
  USER_DETAIL: (userId: number | string) => `/users/${userId}`,
  USER_EDIT: (userId: number | string) => `/users/${userId}/edit`,
} as const;
```

### App.tsx Integration

```typescript
// Lazy-loaded imports
const UsersListPage = lazy(() =>
  import('@/features/users/pages/UsersListPage').then((m) => ({ default: m.UsersListPage }))
);
const UserCreatePage = lazy(() =>
  import('@/features/users/pages/UserCreatePage').then((m) => ({ default: m.UserCreatePage }))
);
const UserEditPage = lazy(() =>
  import('@/features/users/pages/UserEditPage').then((m) => ({ default: m.UserEditPage }))
);
const UserDetailPage = lazy(() =>
  import('@/features/users/pages/UserDetailPage').then((m) => ({ default: m.UserDetailPage }))
);

// Inside the protected layout routes:
<Route path={ROUTES.USERS} element={<UsersListPage />} />
<Route path={ROUTES.USER_CREATE} element={<UserCreatePage />} />
<Route path={ROUTES.USER_EDIT(':userId')} element={<UserEditPage />} />
<Route path={ROUTES.USER_DETAIL(':userId')} element={<UserDetailPage />} />
```

---

## 11. Toast Integration Pattern

Every mutation hook follows the same pattern:

```typescript
import { useToastStore } from '@/stores/toastStore';

// 1. Extract addToast from the store
const addToast = useToastStore((s) => s.addToast);

// 2. Call it from onSuccess
onSuccess: () => {
  addToast('success', 'User created successfully');
  // ... other logic (invalidation, navigation, etc.)
},

// 3. Call it from onError with extracted server message
onError: (err) => {
  const message =
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (err instanceof Error ? err.message : 'Failed to create user');
  addToast('error', message);
},
```

> **Error message extraction fallback:**
> 1. `error.response.data.message` — the actual server error message (e.g., "Email already exists")
> 2. `error.message` — the Axios/JS error message (e.g., "Request failed with status code 422")
> 3. Hardcoded fallback — should never appear if the API is consistent

The `ToastContainer` is rendered once in `App.tsx` and uses `createPortal` to render at `document.body`, so toasts overlay everything regardless of component depth.

---

## 12. Architecture Diagram

```
UserListPage
  │
  ├── useDebounce(search, 300)          # Local UI state
  ├── useUsers({ page, search, role })  # TanStack Query (server state)
  │     └── usersApi.list(params)       # API call via axios
  │
  ├── useDeleteUser()                    # TanStack Mutation
  │     ├── onMutate → optimistic cache update
  │     ├── onSuccess → addToast('success')
  │     ├── onError   → rollback cache + addToast('error')
  │     └── onSettled → invalidateQueries
  │
  └── UserList (presentational)
        ├── Search + role filter
        ├── UserCard[] (per user)
        │     ├── View → /users/:id
        │     ├── Edit → /users/:id/edit
        │     └── Delete → triggers mutation
        └── Pagination controls


UserCreatePage / UserEditPage
  │
  └── UserForm
        ├── mode='create' | mode='edit'
        ├── useForm + zodResolver (React Hook Form + Zod)
        ├── useCreateUser / useUpdateUser (mutations with toasts)
        └── navigate('/users') on success
```

---

## Adding a New CRUD Feature

To add another CRUD feature (e.g., Posts, Products, Orders), copy this structure:

```bash
mkdir -p src/features/{feature}/{api,components,hooks,pages,schemas,types}
```

Then create files in this order:
1. `types/{feature}Types.ts` — data interfaces
2. `schemas/{feature}Schema.ts` — Zod validation
3. `api/{feature}Api.ts` — API service methods
4. `hooks/use{feature}s.ts` — query key factory + list query
5. `hooks/use{feature}.ts` — single record query
6. `hooks/useCreate{feature}.ts` — create mutation + toast
7. `hooks/useUpdate{feature}.ts` — update mutation + toast
8. `hooks/useDelete{feature}.ts` — delete mutation + optimistic update + toast
9. `components/` — presentational components
10. `pages/` — page components
11. Wire routes in `App.tsx`
12. Add nav link in `AppLayout.tsx`

---

> **See the guide files for the broader architectural patterns:**
> - `02_React_Architecture_Best_Practices.md` — hooks, state management, composition
> - `03_Project_Starter_Template.md` — project setup, configuration, other features
