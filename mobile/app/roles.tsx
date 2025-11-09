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
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { Role } from '../types';
import { PERMISSIONS } from '../constants/permissions';

const ALL_PERMISSIONS = [
  { key: PERMISSIONS.TOOL_CREATE, label: 'Create Tools' },
  { key: PERMISSIONS.TOOL_READ, label: 'Read Tools' },
  { key: PERMISSIONS.TOOL_UPDATE, label: 'Update Tools' },
  { key: PERMISSIONS.TOOL_DELETE, label: 'Delete Tools' },
  { key: PERMISSIONS.TOOL_TRANSFER, label: 'Transfer Tools' },
  { key: PERMISSIONS.USER_CREATE, label: 'Create Users' },
  { key: PERMISSIONS.USER_READ, label: 'Read Users' },
  { key: PERMISSIONS.USER_UPDATE, label: 'Update Users' },
  { key: PERMISSIONS.USER_DELETE, label: 'Delete Users' },
  { key: PERMISSIONS.WAREHOUSE_CREATE, label: 'Create Warehouses' },
  { key: PERMISSIONS.WAREHOUSE_READ, label: 'Read Warehouses' },
  { key: PERMISSIONS.WAREHOUSE_UPDATE, label: 'Update Warehouses' },
  { key: PERMISSIONS.WAREHOUSE_DELETE, label: 'Delete Warehouses' },
  { key: PERMISSIONS.INVITATION_CREATE, label: 'Create Invitations' },
  { key: PERMISSIONS.INVITATION_READ, label: 'Read Invitations' },
  { key: PERMISSIONS.INVITATION_DELETE, label: 'Delete Invitations' },
];

export default function RolesScreen() {
  const router = useRouter();
  const { isBoss } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isBoss) {
      Alert.alert('Access Denied', 'Only bosses can manage roles');
      router.back();
      return;
    }
    fetchRoles();
  }, [isBoss]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      Alert.alert('Error', 'Failed to load roles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoles();
  };

  const togglePermission = (permission: string) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const handleAddRole = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a role name');
      return;
    }

    setSaving(true);
    try {
      await api.post('/roles', {
        name,
        permissions: selectedPermissions,
      });
      Alert.alert('Success', 'Role created successfully');
      setShowAddModal(false);
      setName('');
      setSelectedPermissions([]);
      fetchRoles();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!name || !selectedRole) {
      Alert.alert('Error', 'Please enter a role name');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/roles/${selectedRole.id}`, {
        name,
        permissions: selectedPermissions,
      });
      Alert.alert('Success', 'Role updated successfully');
      setShowEditModal(false);
      setSelectedRole(null);
      setName('');
      setSelectedPermissions([]);
      fetchRoles();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isBoss) {
      Alert.alert('Error', 'Cannot delete boss role');
      return;
    }

    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete "${role.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/roles/${role.id}`);
              Alert.alert('Success', 'Role deleted successfully');
              fetchRoles();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete role');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setName(role.name);
    setSelectedPermissions(role.permissions || []);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  const renderRoleItem = ({ item }: { item: Role }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.roleInfo}>
          <View style={styles.roleHeader}>
            <Text style={styles.roleName}>{item.name}</Text>
            {item.isBoss && (
              <View style={styles.bossBadge}>
                <Ionicons name="shield-checkmark" size={12} color="white" />
                <Text style={styles.bossBadgeText}>Boss</Text>
              </View>
            )}
          </View>
          <Text style={styles.permissionCount}>
            {item.permissions?.length || 0} permissions
          </Text>
        </View>
        {!item.isBoss && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="pencil" size={20} color="#3182CE" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteRole(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#E53E3E" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Role</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={roles}
        renderItem={renderRoleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="shield-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyText}>No roles found</Text>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Role</Text>
            <TouchableOpacity onPress={handleAddRole} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Manager, Worker"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Permissions</Text>
              {ALL_PERMISSIONS.map((perm) => (
                <View key={perm.key} style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>{perm.label}</Text>
                  <Switch
                    value={selectedPermissions.includes(perm.key)}
                    onValueChange={() => togglePermission(perm.key)}
                    trackColor={{ false: '#CBD5E0', true: '#90CDF4' }}
                    thumbColor={selectedPermissions.includes(perm.key) ? '#3182CE' : '#E2E8F0'}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Role</Text>
            <TouchableOpacity onPress={handleUpdateRole} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Manager, Worker"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Permissions</Text>
              {ALL_PERMISSIONS.map((perm) => (
                <View key={perm.key} style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>{perm.label}</Text>
                  <Switch
                    value={selectedPermissions.includes(perm.key)}
                    onValueChange={() => togglePermission(perm.key)}
                    trackColor={{ false: '#CBD5E0', true: '#90CDF4' }}
                    thumbColor={selectedPermissions.includes(perm.key) ? '#3182CE' : '#E2E8F0'}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  bossBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3182CE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  bossBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  permissionCount: {
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
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
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
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  permissionLabel: {
    fontSize: 14,
    color: '#2D3748',
  },
});
