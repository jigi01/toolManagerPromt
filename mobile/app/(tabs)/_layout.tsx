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
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct" size={size} color={color} />
          ),
          href: hasPermission(PERMISSIONS.TOOL_READ) ? '/(tabs)/tools' : null,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          href: hasPermission(PERMISSIONS.USER_READ) ? '/(tabs)/users' : null,
        }}
      />
      <Tabs.Screen
        name="warehouses"
        options={{
          title: 'Warehouses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
          href: hasPermission(PERMISSIONS.WAREHOUSE_READ) ? '/(tabs)/warehouses' : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
