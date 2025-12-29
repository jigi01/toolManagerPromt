import { useEffect, useState, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Tool, Category } from '../../types';
import FloatingActionButton from '../../components/FloatingActionButton';
import { useThemeColor } from '../../hooks/useThemeColor';

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

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const inputBackground = useThemeColor({}, 'inputBackground');
  const refreshControlColor = useThemeColor({}, 'refreshControl');

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

  // Обновляем данные каждый раз когда возвращаемся на этот экран
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

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
        style={[styles.toolCard, { backgroundColor: cardColor }]}
        onPress={() => router.push(`/tool/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.toolIcon, { backgroundColor: backgroundColor }]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.toolImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name="construct"
              size={28}
              color={isMyTool ? primaryColor : isAvailable ? '#38A169' : iconColor}
            />
          )}
        </View>
        <View style={styles.toolContent}>
          <Text style={[styles.toolName, { color: textColor }]}>{item.name}</Text>
          {item.serialNumber && (
            <Text style={[styles.toolSerial, { color: textSecondaryColor }]}>SN: {item.serialNumber}</Text>
          )}
          <View style={styles.toolMeta}>
            {item.category && (
              <View style={[styles.categoryBadge, { backgroundColor: backgroundColor }]}>
                <Text style={[styles.categoryText, { color: primaryColor }]}>{item.category.name}</Text>
              </View>
            )}
            {isMyTool ? (
              <View style={[styles.statusBadge, { backgroundColor: backgroundColor }]}>
                <Text style={[styles.statusTextMy, { color: primaryColor }]}>У вас</Text>
              </View>
            ) : isAvailable ? (
              <View style={[styles.statusBadge, { backgroundColor: '#F0FFF4' }]}>
                <Text style={styles.statusTextAvailable}>Доступен</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: backgroundColor }]}>
                <Text style={[styles.statusTextBusy, { color: textSecondaryColor }]}>
                  {item.currentUser?.name || 'Занят'}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={iconColor} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.searchSection, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <View style={[styles.searchBar, { backgroundColor: inputBackground }]}>
          <Ionicons name="search" size={20} color={textSecondaryColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Поиск по названию или S/N"
            placeholderTextColor={textSecondaryColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={textSecondaryColor} />
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
                {
                  backgroundColor: inputBackground,
                  borderColor: borderColor
                },
                selectedCategory === item.id && { backgroundColor: primaryColor, borderColor: primaryColor },
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: textSecondaryColor },
                  selectedCategory === item.id && styles.categoryChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={[styles.resultsHeader, { backgroundColor: backgroundColor }]}>
        <Text style={[styles.resultsText, { color: textSecondaryColor }]}>
          {filteredTools.length} {filteredTools.length === 1 ? 'инструмент' : 'инструментов'}
        </Text>
      </View>

      <FlatList
        data={filteredTools}
        renderItem={renderToolItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[refreshControlColor]} // Dynamic
            tintColor={refreshControlColor} // Dynamic
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={iconColor} />
            <Text style={[styles.emptyText, { color: textSecondaryColor }]}>Инструменты не найдены</Text>
            <Text style={[styles.emptySubtext, { color: textSecondaryColor }]}>
              {searchQuery || selectedCategory
                ? 'Попробуйте изменить параметры поиска'
                : 'В системе пока нет инструментов'}
            </Text>
          </View>
        }
      />
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  categoryList: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  toolImage: {
    width: '100%',
    height: '100%',
  },
  toolContent: {
    flex: 1,
  },
  toolName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  toolSerial: {
    fontSize: 14,
    marginBottom: 8,
  },
  toolMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextMy: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextAvailable: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38A169',
  },
  statusTextBusy: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
