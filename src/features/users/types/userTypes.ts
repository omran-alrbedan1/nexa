export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  regionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'customer' | 'supplier' | 'driver' | 'operations' | 'aggregation' | 'admin';
