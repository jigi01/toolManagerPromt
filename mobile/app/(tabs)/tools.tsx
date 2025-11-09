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
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Tool, Category, Warehouse } from '../../types';
import { PERMISSIONS } from '../../constants/permissions';
import ToolCard from '../../components/ToolCard';
import * as ImagePicker from 'expo-image-picker';

export default function ToolsScreen() {
  const { hasPermission } = useAuthStore();
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    serialNumber: '',
    description: '',
    price: '',
    categoryId: '',
    warehouseId: '',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [toolsRes, categoriesRes, warehousesRes] = await Promise.all([
        api.get('/tools'),
        api.get('/categories'),
        api.get('/warehouses'),
      ]);
      setTools(toolsRes.data.tools || []);
      setFilteredTools(toolsRes.data.tools || []);
      setCategories(categoriesRes.data.categories || []);
      setWarehouses(warehousesRes.data.warehouses || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load tools');
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleAddTool = async () => {
    if (!newTool.name || !newTool.warehouseId) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', newTool.name);
      if (newTool.serialNumber) formData.append('serialNumber', newTool.serialNumber);
      if (newTool.description) formData.append('description', newTool.description);
      if (newTool.price) formData.append('price', newTool.price);
      if (newTool.categoryId) formData.append('categoryId', newTool.categoryId);
      formData.append('warehouseId', newTool.warehouseId);

      if (selectedImage) {
        const filename = selectedImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('image', {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
      }

      await api.post('/tools', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Tool added successfully');
      setShowAddModal(false);
      setNewTool({
        name: '',
        serialNumber: '',
        description: '',
        price: '',
        categoryId: '',
        warehouseId: '',
      });
      setSelectedImage(null);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add tool');
    } finally {
      setSaving(false);
    }
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
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#718096" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tools..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {hasPermission(PERMISSIONS.TOOL_CREATE) && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {categories.length > 0 && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterChip,
                selectedCategory === category.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category.id && styles.filterChipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredTools}
        renderItem={({ item }) => <ToolCard tool={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyText}>No tools found</Text>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Tool</Text>
            <TouchableOpacity onPress={handleAddTool} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera" size={32} color="#718096" />
                  <Text style={styles.imagePickerText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Tool name"
                value={newTool.name}
                onChangeText={(text) => setNewTool({ ...newTool, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Serial Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Serial number"
                value={newTool.serialNumber}
                onChangeText={(text) => setNewTool({ ...newTool, serialNumber: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={newTool.description}
                onChangeText={(text) => setNewTool({ ...newTool, description: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={newTool.price}
                onChangeText={(text) => setNewTool({ ...newTool, price: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.pickerOption,
                      newTool.categoryId === category.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setNewTool({ ...newTool, categoryId: category.id })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        newTool.categoryId === category.id && styles.pickerOptionTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Warehouse *</Text>
              <View style={styles.pickerContainer}>
                {warehouses.map((warehouse) => (
                  <TouchableOpacity
                    key={warehouse.id}
                    style={[
                      styles.pickerOption,
                      newTool.warehouseId === warehouse.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setNewTool({ ...newTool, warehouseId: warehouse.id })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        newTool.warehouseId === warehouse.id && styles.pickerOptionTextActive,
                      ]}
                    >
                      {warehouse.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#3182CE',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#3182CE',
    borderColor: '#3182CE',
  },
  filterChipText: {
    fontSize: 14,
    color: '#718096',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  modalCancel: {
    fontSize: 16,
    color: '#718096',
  },
  modalSave: {
    fontSize: 16,
    color: '#3182CE',
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: '#CBD5E0',
  },
  modalContent: {
    padding: 16,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
    color: '#718096',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerOptionActive: {
    backgroundColor: '#3182CE',
    borderColor: '#3182CE',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#2D3748',
  },
  pickerOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});
