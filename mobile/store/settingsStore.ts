import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  theme: Theme;
  setHaptics: (enabled: boolean) => Promise<void>;
  setSound: (enabled: boolean) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const useSettingsStore = create<SettingsState>((set) => ({
  hapticsEnabled: true,
  soundEnabled: true,
  theme: 'system',

  setHaptics: async (enabled: boolean) => {
    set({ hapticsEnabled: enabled });
    await AsyncStorage.setItem('settings:haptics', JSON.stringify(enabled));
  },

  setSound: async (enabled: boolean) => {
    set({ soundEnabled: enabled });
    await AsyncStorage.setItem('settings:sound', JSON.stringify(enabled));
  },

  setTheme: async (theme: Theme) => {
    set({ theme });
    await AsyncStorage.setItem('settings:theme', theme);
  },

  loadSettings: async () => {
    try {
      const [haptics, sound, theme] = await Promise.all([
        AsyncStorage.getItem('settings:haptics'),
        AsyncStorage.getItem('settings:sound'),
        AsyncStorage.getItem('settings:theme'),
      ]);

      set({
        hapticsEnabled: haptics ? JSON.parse(haptics) : true,
        soundEnabled: sound ? JSON.parse(sound) : true,
        theme: (theme as Theme) || 'system',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },
}));

export default useSettingsStore;
