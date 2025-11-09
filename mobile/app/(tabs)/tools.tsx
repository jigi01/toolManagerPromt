import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Tool, Category } from '../../types';
import { PERMISSIONS } from '../../constants/permissions';

export default function ToolsScreen() {
  const router = useRouter();
  const { hasPermission, user } = useAuthStore();
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const fetchData = async () => {
    try {
      const [toolsRes, categoriesRes] = await Promise.all([
        api.get('/tools'),
        api.get('/categories'),
      ]);
      setTools(toolsRes.data.tools || []);
      setFilteredTools(toolsRes.data.tools || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить инструменты');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = tools;
    
    if (searchQuery) {
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter((tool) => tool.categoryId === selectedCategory);
    }
    
    setFilteredTools(filtered);
  }, [searchQuery, selectedCategory, tools]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderToolItem = ({ item }: { item: Tool }) => {
    const isMyTool = item.currentUser?.id === user?.id;
    const isAvailable = !item.currentUser;

    return (
      <TouchableOpacity
        style={styles.toolCard}
        onPress={() => router.push(`/tool/${item.id}`)}
      >
        <View style={styles.toolIcon}>
          <Ionicons 
            name="construct" 
            size={28} 
            color={isMyTool ? '#3182CE' : isAvailable ? '#38A169' : '#718096'} 
          />
        </View>
        <View style={styles.toolContent}>
          <Text style={styles.toolName}>{item.name}</Text>
          {item.serialNumber && (
            <Text style={styles.toolSerial}>SN: {item.serialNumber}</Text>
          )}
          <View style={styles.toolMeta}>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category.name}</Text>
              </View>
            )}
            {isMyTool ? (
              <View style={[styles.statusBadge, styles.statusBadgeMy]}>
                <Text style={styles.statusTextMy}>У вас</Text>
              </View>
            ) : isAvailable ? (
              <View style={[styles.statusBadge, styles.statusBadgeAvailable]}>
                <Text style={styles.statusTextAvailable}>Доступен</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusBadgeBusy]}>
                <Text style={styles.statusTextBusy}>
                  {item.currentUser?.name || 'Занят'}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#CBD5E0" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#718096" />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по названию или S/N"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#CBD5E0" />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          horizontal
          data={[{ id: '', name: 'Все' }, ...categories]}
          keyExtractor={(item) => item.id || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.id && styles.categoryChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredTools.length} {filteredTools.length === 1 ? 'инструмент' : 'инструментов'}
        </Text>
      </View>

      <FlatList
        data={filteredTools}
        renderItem={renderToolItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyText}>Инструменты не найдены</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory
                ? 'Попробуйте изменить параметры поиска'
                : 'В системе пока нет инструментов'}
            </Text>
          </View>
        }
      />
    </View>
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
  searchSection: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#2D3748',
  },
  categoryList: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#3182CE',
    borderColor: '#3182CE',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F7FAFC',
  },
  resultsText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolContent: {
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
    marginBottom: 8,
  },
  toolMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3182CE',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeMy: {
    backgroundColor: '#EBF8FF',
  },
  statusTextMy: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3182CE',
  },
  statusBadgeAvailable: {
    backgroundColor: '#F0FFF4',
  },
  statusTextAvailable: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38A169',
  },
  statusBadgeBusy: {
    backgroundColor: '#F7FAFC',
  },
  statusTextBusy: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
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
    paddingHorizontal: 32,
  },
});
