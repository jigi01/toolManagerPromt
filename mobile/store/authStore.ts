import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native'; // Добавил Alert
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
      if (Platform.OS !== 'web') {
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
      if (Platform.OS !== 'web') {
        await AsyncStorage.removeItem('token');
      }
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
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      if (token && Platform.OS !== 'web') {
        await AsyncStorage.setItem('token', token);
      }
      
      set({
        user,
        isAuthenticated: true,
        isBoss: user.role?.isBoss || false,
        permissions: user.role?.permissions || [],
        loading: false,
      });
    } catch (error: any) {
      // --- БЛОК ОТЛАДКИ (LOGIN) ---
      let errorText = "Неизвестная ошибка";
      const url = api.defaults.baseURL; // Посмотрим, куда летит запрос

      if (error.response) {
        // Сервер ответил ошибкой (400, 401, 500 и т.д.)
        errorText = `Статус: ${error.response.status}\nОтвет: ${JSON.stringify(error.response.data, null, 2)}`;
      } else if (error.request) {
        // Запрос ушел, но ответа нет
        errorText = "Нет ответа от сервера (Network Error). Проверьте интернет или URL API.";
      } else {
        errorText = error.message;
      }
      
      // Показываем Alert только на мобилках
      if (Platform.OS !== 'web') {
        Alert.alert("DEBUG: Ошибка входа", `URL: ${url}\n\n${errorText}`);
      }
      console.error("Login Error:", errorText);
      
      // Пробрасываем ошибку дальше, чтобы UI мог среагировать
      throw error;
    }
  },

  register: async (data: { name: string; email: string; password: string; companyName: string }) => {
    try {
      const response = await api.post('/auth/register', data);
      const { user, token } = response.data;
      
      if (token && Platform.OS !== 'web') {
        await AsyncStorage.setItem('token', token);
      }
      
      set({
        user,
        isAuthenticated: true,
        isBoss: user.role?.isBoss || false,
        permissions: user.role?.permissions || [],
        loading: false,
      });
    } catch (error: any) {
      // --- БЛОК ОТЛАДКИ (REGISTER) ---
      let errorText = "Неизвестная ошибка";
      const url = api.defaults.baseURL;

      if (error.response) {
        // Сервер ответил ошибкой (скорее всего валидация данных)
        errorText = `Статус: ${error.response.status}\nОтвет: ${JSON.stringify(error.response.data, null, 2)}`;
      } else if (error.request) {
        errorText = "Нет ответа от сервера (Network Error).";
      } else {
        errorText = error.message;
      }
      
      if (Platform.OS !== 'web') {
        Alert.alert("DEBUG: Ошибка регистрации", `URL: ${url}\n\n${errorText}`);
      }
      console.error("Register Error:", errorText);

      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (Platform.OS !== 'web') {
        await AsyncStorage.removeItem('token');
      }
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