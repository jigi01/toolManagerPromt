import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { PERMISSIONS } from '../../constants/permissions';

export default function TabLayout() {
  const { isBoss, hasPermission } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3182CE',
        tabBarInactiveTintColor: '#718096',
        headerStyle: {
          backgroundColor: '#3182CE',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Инструменты',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct" size={size} color={color} />
          ),
          href: hasPermission(PERMISSIONS.TOOL_READ) ? '/(tabs)/tools' : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="warehouses"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
