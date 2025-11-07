import { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Tool, User } from '../../types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isBoss } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [myTools, setMyTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, toolsRes] = await Promise.all([
        api.get('/tools/stats'),
        api.get('/tools/my'),
      ]);
      setStats(statsRes.data);
      setMyTools(toolsRes.data.tools || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.name}!</Text>
        <Text style={styles.role}>{user?.role?.name}</Text>
      </View>

      {isBoss && stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="construct" size={32} color="#3182CE" />
            <Text style={styles.statNumber}>{stats.totalTools || 0}</Text>
            <Text style={styles.statLabel}>Total Tools</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color="#38A169" />
            <Text style={styles.statNumber}>{stats.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="business" size={32} color="#D69E2E" />
            <Text style={styles.statNumber}>{stats.totalWarehouses || 0}</Text>
            <Text style={styles.statLabel}>Warehouses</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color="#805AD5" />
            <Text style={styles.statNumber}>{stats.assignedTools || 0}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Tools ({myTools.length})</Text>
        {myTools.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#CBD5E0" />
            <Text style={styles.emptyText}>No tools assigned</Text>
          </View>
        ) : (
          myTools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => router.push(`/tool/${tool.id}`)}
            >
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

      {isBoss && (
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/tools')}
          >
            <Ionicons name="add-circle" size={24} color="#3182CE" />
            <Text style={styles.actionText}>Add New Tool</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/users')}
          >
            <Ionicons name="person-add" size={24} color="#3182CE" />
            <Text style={styles.actionText}>Invite User</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    paddingTop: 48,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#BEE3F8',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 48,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 12,
  },
  toolCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
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
    fontSize: 12,
    color: '#3182CE',
  },
  quickActions: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 12,
  },
});
