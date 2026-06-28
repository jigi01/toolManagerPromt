import { create } from 'zustand';
import api from '../services/api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/tasks?${params.toString()}`);
      set({ tasks: data.tasks, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Ошибка при загрузке задач',
        isLoading: false 
      });
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/tasks', taskData);
      set((state) => ({ 
        tasks: [data.task, ...state.tasks],
        isLoading: false 
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Ошибка при создании задачи',
        isLoading: false 
      });
      return false;
    }
  },

  updateTaskStatus: async (taskId, status, cancellationReason = null) => {
    set({ isLoading: true, error: null });
    try {
      const payload = { status };
      if (cancellationReason) {
        payload.cancellationReason = cancellationReason;
      }
      const { data } = await api.patch(`/tasks/${taskId}/status`, payload);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? data.task : t),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Ошибка при обновлении статуса',
        isLoading: false 
      });
      return false;
    }
  }
}));

export default useTaskStore;
