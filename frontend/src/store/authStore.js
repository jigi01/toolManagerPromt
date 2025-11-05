import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isBoss: false,
  permissions: [],
  loading: true,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isBoss: user?.role?.isBoss || false,
    permissions: user?.role?.permissions || [],
    loading: false
  }),

  hasPermission: (permission) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },

  hasAnyPermission: (permissionList) => {
    const { permissions } = get();
    return permissionList.some(p => permissions.includes(p));
  },

  checkAuth: async () => {
    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        isBoss: response.data.user.role?.isBoss || false,
        permissions: response.data.user.role?.permissions || [],
        loading: false
      });
      return true;
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isBoss: false,
        permissions: [],
        loading: false
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isBoss: false,
        permissions: []
      });
    }
  }
}));

export default useAuthStore;
