export interface User {
  id: string;
  email: string;
  name: string;
  companyId: string;
  roleId: string;
  role?: Role;
  company?: Company;
  currentTools?: Tool[];
}

export interface Role {
  id: string;
  name: string;
  isBoss: boolean;
  permissions: string[];
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface Tool {
  id: string;
  name: string;
  serialNumber?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  categoryId?: string;
  category?: Category;
  warehouseId?: string;
  warehouse?: Warehouse;
  currentUserId?: string;
  currentUser?: User;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  companyId: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  companyId: string;
}

export interface ToolHistory {
  id: string;
  toolId: string;
  tool?: Tool;
  userId: string;
  user?: User;
  action: 'TRANSFER' | 'CHECK_IN';
  fromUserId?: string;
  fromUser?: User;
  toUserId?: string;
  toUser?: User;
  warehouseId?: string;
  warehouse?: Warehouse;
  notes?: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  roleId: string;
  role?: Role;
  companyId: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  createdById: string;
  createdBy?: User;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface ApiError {
  error?: string;
  message?: string;
}

export type ViewMode = 'grid' | 'list';
