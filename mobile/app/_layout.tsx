import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { useTheme, useThemeColor } from '../hooks/useThemeColor';

SplashScreen.preventAutoHideAsync();

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#38A169', height: 80, width: '90%' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 17,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 15
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#E53E3E', height: 80, width: '90%' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 17,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 15
      }}
    />
  )
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, loading, checkAuth } = useAuthStore();
  const { loadSettings } = useSettingsStore();
  const theme = useTheme();
  const headerBackground = useThemeColor({}, 'primary');
  const headerTintColor = '#ffffff';

  useEffect(() => {
    checkAuth();
    loadSettings();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, segments]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore error if splash screen is already hidden
      });
    }
  }, [loading]);

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="scanner"
          options={{
            headerShown: true,
            title: 'Сканировать QR',
            headerStyle: { backgroundColor: headerBackground },
            headerTintColor: headerTintColor,
          }}
        />
        <Stack.Screen
          name="tool/[id]"
          options={{
            headerShown: true,
            title: 'Информация об инструменте',
            headerStyle: { backgroundColor: headerBackground },
            headerTintColor: headerTintColor,
          }}
        />
        <Stack.Screen
          name="roles"
          options={{
            headerShown: true,
            title: 'Роли',
            headerStyle: { backgroundColor: headerBackground },
            headerTintColor: headerTintColor,
          }}
        />
      </Stack>
      <Toast config={toastConfig} topOffset={60} />
    </>
  );
}
