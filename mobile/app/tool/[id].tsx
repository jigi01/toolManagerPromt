import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Tool, ToolHistory, User, Warehouse } from '../../types';
import { PERMISSIONS } from '../../constants/permissions';
import { formatPrice, formatDateTime } from '../../utils/format';
import QRCode from 'react-native-qrcode-svg';

export default function ToolDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { hasPermission, user } = useAuthStore();
  const [tool, setTool] = useState<Tool | null>(null);
  const [history, setHistory] = useState<ToolHistory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [transferUserId, setTransferUserId] = useState('');
  const [checkInWarehouseId, setCheckInWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      const [toolRes, historyRes, usersRes, warehousesRes] = await Promise.all([
        api.get(`/tools/${id}`),
        api.get(`/tools/${id}/history`),
        api.get('/users'),
        api.get('/warehouses'),
      ]);
      setTool(toolRes.data.tool);
      setHistory(historyRes.data.history || []);
      setUsers(usersRes.data.users || []);
      setWarehouses(warehousesRes.data.warehouses || []);
    } catch (error) {
      console.error('Error fetching tool:', error);
      Alert.alert('Error', 'Failed to load tool details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleTransfer = async () => {
    if (!transferUserId) {
      Alert.alert('Error', 'Please select a user');
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/transfer/tool/${id}`, {
        toUserId: transferUserId,
        notes,
      });
      Alert.alert('Success', 'Tool transferred successfully');
      setShowTransferModal(false);
      setTransferUserId('');
      setNotes('');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to transfer tool');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckIn = async () => {
    if (!checkInWarehouseId) {
      Alert.alert('Error', 'Please select a warehouse');
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/transfer/checkin/${id}`, {
        warehouseId: checkInWarehouseId,
        notes,
      });
      Alert.alert('Success', 'Tool checked in successfully');
      setShowCheckInModal(false);
      setCheckInWarehouseId('');
      setNotes('');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to check in tool');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Tool',
      'Are you sure you want to delete this tool?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tools/${id}`);
              Alert.alert('Success', 'Tool deleted successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete tool');
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

  if (!tool) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Tool not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {tool.imageUrl ? (
          <Image source={{ uri: tool.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="construct" size={64} color="#CBD5E0" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{tool.name}</Text>
            {tool.serialNumber && (
              <Text style={styles.serial}>SN: {tool.serialNumber}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setShowQR(true)}
          >
            <Ionicons name="qr-code" size={24} color="#3182CE" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(tool.price)}</Text>
        </View>

        {tool.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{tool.description}</Text>
          </View>
        )}

        <View style={styles.infoGrid}>
          {tool.category && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{tool.category.name}</Text>
            </View>
          )}
          {tool.currentUser ? (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Assigned To</Text>
              <Text style={styles.infoValue}>{tool.currentUser.name}</Text>
            </View>
          ) : tool.warehouse ? (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{tool.warehouse.name}</Text>
            </View>
          ) : null}
        </View>

        {hasPermission(PERMISSIONS.TOOL_TRANSFER) && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowTransferModal(true)}
            >
              <Ionicons name="swap-horizontal" size={20} color="white" />
              <Text style={styles.actionButtonText}>Transfer</Text>
            </TouchableOpacity>
            {tool.currentUser && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => setShowCheckInModal(true)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#3182CE" />
                <Text style={styles.actionButtonTextSecondary}>Check In</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {hasPermission(PERMISSIONS.TOOL_DELETE) && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color="#E53E3E" />
            <Text style={styles.deleteButtonText}>Delete Tool</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No history</Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons
                    name={item.action === 'TRANSFER' ? 'swap-horizontal' : 'checkmark-circle'}
                    size={20}
                    color={item.action === 'TRANSFER' ? '#3182CE' : '#38A169'}
                  />
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyAction}>
                    {item.action === 'TRANSFER' ? 'Transferred' : 'Checked In'}
                  </Text>
                  {item.action === 'TRANSFER' && item.toUser && (
                    <Text style={styles.historyDetail}>To: {item.toUser.name}</Text>
                  )}
                  {item.action === 'CHECK_IN' && item.warehouse && (
                    <Text style={styles.historyDetail}>
                      Warehouse: {item.warehouse.name}
                    </Text>
                  )}
                  {item.notes && (
                    <Text style={styles.historyNotes}>{item.notes}</Text>
                  )}
                  <Text style={styles.historyDate}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <Modal
        visible={showQR}
        animationType="fade"
        transparent
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <Text style={styles.qrTitle}>{tool.name}</Text>
            <View style={styles.qrContainer}>
              <QRCode value={tool.id} size={250} />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQR(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTransferModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Transfer Tool</Text>
            <TouchableOpacity onPress={handleTransfer} disabled={processing}>
              <Text style={[styles.modalSave, processing && styles.modalSaveDisabled]}>
                {processing ? 'Transferring...' : 'Transfer'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Select User</Text>
            {users.filter(u => u.id !== user?.id).map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[
                  styles.pickerOption,
                  transferUserId === u.id && styles.pickerOptionActive,
                ]}
                onPress={() => setTransferUserId(u.id)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    transferUserId === u.id && styles.pickerOptionTextActive,
                  ]}
                >
                  {u.name} ({u.email})
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={[styles.label, { marginTop: 16 }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCheckInModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCheckInModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Check In Tool</Text>
            <TouchableOpacity onPress={handleCheckIn} disabled={processing}>
              <Text style={[styles.modalSave, processing && styles.modalSaveDisabled]}>
                {processing ? 'Checking In...' : 'Check In'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Select Warehouse</Text>
            {warehouses.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[
                  styles.pickerOption,
                  checkInWarehouseId === w.id && styles.pickerOptionActive,
                ]}
                onPress={() => setCheckInWarehouseId(w.id)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    checkInWarehouseId === w.id && styles.pickerOptionTextActive,
                  ]}
                >
                  {w.name}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={[styles.label, { marginTop: 16 }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </Modal>
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
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F7FAFC',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  serial: {
    fontSize: 14,
    color: '#718096',
  },
  qrButton: {
    padding: 8,
  },
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3182CE',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182CE',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3182CE',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#3182CE',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E53E3E',
    marginBottom: 24,
    gap: 8,
  },
  deleteButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  historyDetail: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 2,
  },
  historyNotes: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    margin: 20,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  pickerOption: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
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
  input: {
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
});
