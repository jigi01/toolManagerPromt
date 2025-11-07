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
import { User, Role, Invitation } from '../../types';
import { PERMISSIONS } from '../../constants/permissions';

export default function UsersScreen() {
  const { hasPermission, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');

  const fetchData = async () => {
    try {
      const [usersRes, invitationsRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/invitations'),
        api.get('/roles'),
      ]);
      setUsers(usersRes.data.users || []);
      setInvitations(invitationsRes.data.invitations || []);
      setRoles(rolesRes.data.roles || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSendInvitation = async () => {
    if (!email || !selectedRoleId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await api.post('/invitations', {
        email,
        roleId: selectedRoleId,
      });
      Alert.alert('Success', 'Invitation sent successfully');
      setShowInviteModal(false);
      setEmail('');
      setSelectedRoleId('');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteInvitation = (invitationId: string) => {
    Alert.alert(
      'Delete Invitation',
      'Are you sure you want to delete this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/invitations/${invitationId}`);
              Alert.alert('Success', 'Invitation deleted');
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete invitation');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/${userId}`);
              Alert.alert('Success', 'User deleted');
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#3182CE" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.role?.name}</Text>
          </View>
        </View>
      </View>
      {hasPermission(PERMISSIONS.USER_DELETE) && item.id !== currentUser?.id && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteUser(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#E53E3E" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderInvitationItem = ({ item }: { item: Invitation }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={[styles.avatar, { backgroundColor: '#FED7D7' }]}>
          <Ionicons name="mail" size={24} color="#E53E3E" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.role?.name}</Text>
          </View>
          <Text style={styles.invitationStatus}>
            {item.isUsed ? 'Used' : 'Pending'}
          </Text>
        </View>
      </View>
      {hasPermission(PERMISSIONS.INVITATION_DELETE) && !item.isUsed && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteInvitation(item.id)}
        >
          <Ionicons name="close-circle-outline" size={20} color="#E53E3E" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.tabActive]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
              Users ({users.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'invitations' && styles.tabActive]}
            onPress={() => setActiveTab('invitations')}
          >
            <Text style={[styles.tabText, activeTab === 'invitations' && styles.tabTextActive]}>
              Invitations ({invitations.length})
            </Text>
          </TouchableOpacity>
        </View>
        {hasPermission(PERMISSIONS.INVITATION_CREATE) && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'users' ? (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#CBD5E0" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={invitations}
          renderItem={renderInvitationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={64} color="#CBD5E0" />
              <Text style={styles.emptyText}>No invitations found</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invite User</Text>
            <TouchableOpacity onPress={handleSendInvitation} disabled={sending}>
              <Text style={[styles.modalSave, sending && styles.modalSaveDisabled]}>
                {sending ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="user@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role *</Text>
              <View style={styles.pickerContainer}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.pickerOption,
                      selectedRoleId === role.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setSelectedRoleId(role.id)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        selectedRoleId === role.id && styles.pickerOptionTextActive,
                      ]}
                    >
                      {role.name}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#EBF8FF',
  },
  tabText: {
    fontSize: 14,
    color: '#718096',
  },
  tabTextActive: {
    color: '#3182CE',
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3182CE',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#2D3748',
    fontWeight: '500',
  },
  invitationStatus: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  deleteButton: {
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
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
