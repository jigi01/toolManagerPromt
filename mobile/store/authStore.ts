import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isBoss: boolean;
  permissions: string[];
  loading: boolean;
  setUser: (user: User | null) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissionList: string[]) => boolean;
  checkAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; companyName: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isBoss: false,
  permissions: [],
  loading: true,

  setUser: (user: User | null) => set({
    user,
    isAuthenticated: !!user,
    isBoss: user?.role?.isBoss || false,
    permissions: user?.role?.permissions || [],
    loading: false,
  }),

  hasPermission: (permission: string) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },

  hasAnyPermission: (permissionList: string[]) => {
    const { permissions } = get();
    return permissionList.some(p => permissions.includes(p));
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          isBoss: false,
          permissions: [],
          loading: false,
        });
        return false;
      }

      const response = await api.get('/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        isBoss: response.data.user.role?.isBoss || false,
        permissions: response.data.user.role?.permissions || [],
        loading: false,
      });
      return true;
    } catch (error) {
      await AsyncStorage.removeItem('token');
      set({
        user: null,
        isAuthenticated: false,
        isBoss: false,
        permissions: [],
        loading: false,
      });
      return false;
    }
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    
    if (token) {
      await AsyncStorage.setItem('token', token);
    }
    
    set({
      user,
      isAuthenticated: true,
      isBoss: user.role?.isBoss || false,
      permissions: user.role?.permissions || [],
      loading: false,
    });
  },

  register: async (data: { name: string; email: string; password: string; companyName: string }) => {
    const response = await api.post('/auth/register', data);
    const { user, token } = response.data;
    
    if (token) {
      await AsyncStorage.setItem('token', token);
    }
    
    set({
      user,
      isAuthenticated: true,
      isBoss: user.role?.isBoss || false,
      permissions: user.role?.permissions || [],
      loading: false,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('token');
      set({
        user: null,
        isAuthenticated: false,
        isBoss: false,
        permissions: [],
      });
    }
  },
}));

export default useAuthStore;
