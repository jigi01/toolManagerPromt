import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    loading: false
  }),

  checkAuth: async () => {
    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        isAdmin: response.data.user.role === 'ADMIN',
        loading: false
      });
      return true;
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
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
        isAdmin: false
      });
    }
  }
}));

export default useAuthStore;
