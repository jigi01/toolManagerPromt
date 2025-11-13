import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Tool } from '../../types';
import FloatingActionButton from '../../components/FloatingActionButton';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [myTools, setMyTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyTools = async () => {
    try {
      const response = await api.get('/tools/my');
      setMyTools(response.data.tools || []);
    } catch (error) {
      console.error('Error fetching my tools:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyTools();
  }, []);

  // Обновляем данные каждый раз когда возвращаемся на этот экран
  useFocusEffect(
    useCallback(() => {
      fetchMyTools();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTools();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Привет, {user?.name}!</Text>
        <Text style={styles.subtitle}>Быстрые действия с инструментами</Text>
      </View>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push('/scanner')}
        activeOpacity={0.8}
      >
        <View style={styles.scanButtonIcon}>
          <Ionicons name="qr-code-outline" size={64} color="white" />
        </View>
        <Text style={styles.scanButtonText}>СКАНИРОВАТЬ QR-КОД</Text>
        <Text style={styles.scanButtonSubtext}>
          Наведите камеру на QR-код инструмента
        </Text>
      </TouchableOpacity>

      <View style={styles.myToolsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="briefcase" size={24} color="#2D3748" />
          <Text style={styles.sectionTitle}>Мои инструменты ({myTools.length})</Text>
        </View>

        {myTools.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#CBD5E0" />
            <Text style={styles.emptyText}>У вас нет инструментов</Text>
            <Text style={styles.emptySubtext}>
              Отсканируйте QR-код, чтобы взять инструмент
            </Text>
          </View>
        ) : (
          myTools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => router.push(`/tool/${tool.id}`)}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="construct" size={28} color="#3182CE" />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>{tool.name}</Text>
                {tool.serialNumber && (
                  <Text style={styles.toolSerial}>SN: {tool.serialNumber}</Text>
                )}
                {tool.category && (
                  <Text style={styles.toolCategory}>{tool.category.name}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CBD5E0" />
            </TouchableOpacity>
          ))
        )}
      </View>
      <FloatingActionButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3182CE',
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#BEE3F8',
  },
  scanButton: {
    backgroundColor: '#3182CE',
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonIcon: {
    marginBottom: 16,
  },
  scanButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    letterSpacing: 1,
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: '#BEE3F8',
    textAlign: 'center',
  },
  myToolsSection: {
    padding: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#718096',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  toolCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  toolSerial: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 2,
  },
  toolCategory: {
    fontSize: 13,
    color: '#3182CE',
    fontWeight: '500',
  },
});
