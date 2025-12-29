import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import useAuthStore from '../../store/authStore';
import { PERMISSIONS } from '../../constants/permissions';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function TabLayout() {
  const { isAuthenticated, loading, isBoss, hasPermission } = useAuthStore();
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const tabBarActive = useThemeColor({}, 'tabIconSelected');
  const tabBarInactive = useThemeColor({}, 'tabIconDefault');
  const headerBackground = useThemeColor({}, 'primary');
  const tabBackgroundColor = useThemeColor({}, 'card');
  const tabBorderColor = useThemeColor({}, 'border');
  const headerText = '#ffffff'; // Always white for contrast on primary color

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabBarActive,
        tabBarInactiveTintColor: tabBarInactive,
        tabBarStyle: {
          backgroundColor: tabBackgroundColor,
          borderTopColor: tabBorderColor,
        },
        headerStyle: {
          backgroundColor: headerBackground,
        },
        headerTintColor: headerText,
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
