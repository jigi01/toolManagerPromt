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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Warehouse } from '../../types';
import { PERMISSIONS } from '../../constants/permissions';

export default function WarehousesScreen() {
  const { hasPermission } = useAuthStore();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.warehouses || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      Alert.alert('Error', 'Failed to load warehouses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWarehouses();
  };

  const handleAddWarehouse = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a warehouse name');
      return;
    }

    setSaving(true);
    try {
      await api.post('/warehouses', { name, location });
      Alert.alert('Success', 'Warehouse added successfully');
      setShowAddModal(false);
      setName('');
      setLocation('');
      fetchWarehouses();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add warehouse');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWarehouse = async () => {
    if (!name || !selectedWarehouse) {
      Alert.alert('Error', 'Please enter a warehouse name');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/warehouses/${selectedWarehouse.id}`, { name, location });
      Alert.alert('Success', 'Warehouse updated successfully');
      setShowEditModal(false);
      setSelectedWarehouse(null);
      setName('');
      setLocation('');
      fetchWarehouses();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update warehouse');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    Alert.alert(
      'Delete Warehouse',
      `Are you sure you want to delete "${warehouse.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/warehouses/${warehouse.id}`);
              Alert.alert('Success', 'Warehouse deleted successfully');
              fetchWarehouses();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete warehouse');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setName(warehouse.name);
    setLocation(warehouse.location || '');
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  const renderWarehouseItem = ({ item }: { item: Warehouse }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.icon}>
          <Ionicons name="business" size={24} color="#3182CE" />
        </View>
        <View style={styles.warehouseInfo}>
          <Text style={styles.warehouseName}>{item.name}</Text>
          {item.location && (
            <Text style={styles.warehouseLocation}>{item.location}</Text>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        {hasPermission(PERMISSIONS.WAREHOUSE_UPDATE) && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil" size={20} color="#3182CE" />
          </TouchableOpacity>
        )}
        {hasPermission(PERMISSIONS.WAREHOUSE_DELETE) && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteWarehouse(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#E53E3E" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {hasPermission(PERMISSIONS.WAREHOUSE_CREATE) && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Warehouse</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={warehouses}
        renderItem={renderWarehouseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyText}>No warehouses found</Text>
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
            <Text style={styles.modalTitle}>Add Warehouse</Text>
            <TouchableOpacity onPress={handleAddWarehouse} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Warehouse name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Address or location"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Warehouse</Text>
            <TouchableOpacity onPress={handleUpdateWarehouse} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Warehouse name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Address or location"
                value={location}
                onChangeText={setLocation}
              />
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
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182CE',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  warehouseLocation: {
    fontSize: 14,
    color: '#718096',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
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
});
