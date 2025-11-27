import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import * as Application from 'expo-application';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    hapticsEnabled,
    soundEnabled,
    theme,
    setHaptics,
    setSound,
    setTheme,
    loadSettings,
  } = useSettingsStore();

  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => {
    loadSettings();
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    const { status } = await Camera.getCameraPermissionsAsync();
    setCameraPermission(status);
  };

  const handleLogout = () => {
    Alert.alert(
      'Выйти',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'light':
        return 'Светлая';
      case 'dark':
        return 'Темная';
      case 'system':
        return 'Как в системе';
      default:
        return 'Как в системе';
    }
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Тема оформления',
      'Выберите тему',
      [
        {
          text: 'Светлая',
          onPress: () => setTheme('light'),
        },
        {
          text: 'Темная',
          onPress: () => setTheme('dark'),
        },
        {
          text: 'Как в системе',
          onPress: () => setTheme('system'),
        },
        {
          text: 'Отмена',
          style: 'cancel',
        },
      ]
    );
  };

  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  return (
    <ScrollView style={styles.container}>
      {/* Управление аккаунтом */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>УПРАВЛЕНИЕ АККАУНТОМ</Text>
        
        <View style={styles.card}>
          <Text style={styles.userInfoLabel}>Вы вошли как:</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.logoutButtonText}>ВЫЙТИ</Text>
        </TouchableOpacity>
      </View>

      {/* Поведение приложения */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ПОВЕДЕНИЕ ПРИЛОЖЕНИЯ</Text>
        
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color="#718096" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Виброотклик при сканировании</Text>
                <Text style={styles.settingDescription}>Тактильная отдача при считывании QR</Text>
              </View>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHaptics}
              trackColor={{ false: '#CBD5E0', true: '#63B3ED' }}
              thumbColor={hapticsEnabled ? '#3182CE' : '#E2E8F0'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-medium-outline" size={20} color="#718096" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Звук при сканировании</Text>
                <Text style={styles.settingDescription}>Звуковой сигнал при считывании QR</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSound}
              trackColor={{ false: '#CBD5E0', true: '#63B3ED' }}
              thumbColor={soundEnabled ? '#3182CE' : '#E2E8F0'}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleThemeChange}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="color-palette-outline" size={20} color="#718096" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Тема оформления</Text>
                <Text style={styles.settingDescription}>{getThemeLabel(theme)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Разрешения и Информация */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>РАЗРЕШЕНИЯ</Text>
        
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="camera-outline" size={20} color="#718096" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Доступ к камере</Text>
                <Text style={[
                  styles.settingDescription,
                  cameraPermission === 'granted' ? styles.permissionGranted : styles.permissionDenied
                ]}>
                  {cameraPermission === 'granted' ? 'Разрешен' : 'Запрещен'}
                </Text>
              </View>
            </View>
            {cameraPermission !== 'granted' && (
              <TouchableOpacity
                style={styles.openSettingsButton}
                onPress={openAppSettings}
                activeOpacity={0.7}
              >
                <Text style={styles.openSettingsButtonText}>Открыть настройки</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* О приложении */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutText}>
          ToolManager, версия {appVersion} (сборка {buildNumber})
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#4A5568',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53E3E',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#E53E3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#A0AEC0',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  permissionGranted: {
    color: '#38A169',
    fontWeight: '600',
  },
  permissionDenied: {
    color: '#E53E3E',
    fontWeight: '600',
  },
  openSettingsButton: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  openSettingsButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  aboutSection: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
  },
});
