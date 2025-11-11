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
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Tool, User, Warehouse } from '../../types';
import { PERMISSIONS } from '../../constants/permissions';

export default function ToolDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, hasPermission } = useAuthStore();
  const [tool, setTool] = useState<Tool | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [transferUserId, setTransferUserId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [processing, setProcessing] = useState(false);

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const fetchData = async () => {
    try {
      const toolRes = await api.get(`/tools/${id}`);
      setTool(toolRes.data.tool);
    } catch (error) {
      console.error('Error fetching tool:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные инструмента');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const fetchedUsers = response.data.users || [];
      setUsers(fetchedUsers);
      return fetchedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список пользователей');
      return [];
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      const fetchedWarehouses = response.data.warehouses || [];
      setWarehouses(fetchedWarehouses);
      return fetchedWarehouses;
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список складов');
      return [];
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleTake = async () => {
    setProcessing(true);
    try {
      await api.post(`/tools/${id}/transfer`, {
        toUserId: user?.id,
      });
      Alert.alert('Успех', 'Инструмент взят', [
        {
          text: 'OK',
          onPress: () => {
            fetchData();
            // Небольшая задержка перед возвратом для обновления данных
            setTimeout(() => router.back(), 100);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось взять инструмент');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async () => {
    // Проверяем права на просмотр складов
    if (!hasPermission(PERMISSIONS.WAREHOUSE_READ)) {
      Alert.alert(
        'Нет прав',
        'У вас нет прав на просмотр списка складов. Инструмент будет возвращен на склад по умолчанию.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Вернуть',
            onPress: async () => {
              setProcessing(true);
              try {
                await api.post(`/tools/${id}/checkin`, {});
                Alert.alert('Успех', 'Инструмент возвращен на склад', [
                  {
                    text: 'OK',
                    onPress: () => {
                      fetchData();
                      setTimeout(() => router.back(), 100);
                    },
                  },
                ]);
              } catch (error: any) {
                Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось вернуть инструмент');
              } finally {
                setProcessing(false);
              }
            },
          },
        ]
      );
      return;
    }

    // Загружаем список складов если есть права
    if (warehouses.length === 0) {
      await fetchWarehouses();
    }
    setShowReturnModal(true);
  };

  const handleReturnConfirm = async () => {
    if (!selectedWarehouseId) {
      Alert.alert('Ошибка', 'Выберите склад');
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/tools/${id}/checkin`, {
        warehouseId: selectedWarehouseId,
      });
      setShowReturnModal(false);
      setSelectedWarehouseId('');
      Alert.alert('Успех', 'Инструмент возвращен на склад', [
        {
          text: 'OK',
          onPress: () => {
            fetchData();
            setTimeout(() => router.back(), 100);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось вернуть инструмент');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferUserId) {
      Alert.alert('Ошибка', 'Выберите пользователя');
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/tools/${id}/transfer`, {
        toUserId: transferUserId,
      });
      setShowTransferModal(false);
      setTransferUserId('');
      Alert.alert('Успех', 'Инструмент передан', [
        {
          text: 'OK',
          onPress: () => {
            fetchData();
            setTimeout(() => router.back(), 100);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось передать инструмент');
    } finally {
      setProcessing(false);
    }
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
        <Text style={styles.errorText}>Инструмент не найден</Text>
      </View>
    );
  }

  const isMyTool = tool.currentUser?.id === user?.id;
  const isAvailable = !tool.currentUser;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          {tool.imageUrl ? (
            <Image source={{ uri: tool.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="construct" size={80} color="#CBD5E0" />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{tool.name}</Text>
          
          {tool.serialNumber && (
            <Text style={styles.serial}>SN: {tool.serialNumber}</Text>
          )}

          {tool.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{tool.category.name}</Text>
            </View>
          )}

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons 
                name={isAvailable ? 'checkmark-circle' : 'person'} 
                size={24} 
                color={isAvailable ? '#38A169' : '#3182CE'} 
              />
              <Text style={styles.statusTitle}>Статус</Text>
            </View>
            {isAvailable ? (
              <View style={styles.statusContent}>
                <Text style={styles.statusLabel}>На складе</Text>
                {tool.warehouse && (
                  <Text style={styles.statusValue}>{tool.warehouse.name}</Text>
                )}
              </View>
            ) : (
              <View style={styles.statusContent}>
                <Text style={styles.statusLabel}>
                  {isMyTool ? 'У вас' : 'Занят'}
                </Text>
                {tool.currentUser && (
                  <Text style={styles.statusValue}>{tool.currentUser.name}</Text>
                )}
              </View>
            )}
          </View>

          {tool.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionTitle}>Описание</Text>
              <Text style={styles.description}>{tool.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        {isAvailable && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleTake}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="hand-left" size={24} color="white" />
                <Text style={styles.actionButtonText}>ВЗЯТЬ СЕБЕ</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {isMyTool && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleReturn}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#3182CE" />
              ) : (
                <>
                  <Ionicons name="return-down-back" size={24} color="#3182CE" />
                  <Text style={styles.actionButtonTextSecondary}>ВЕРНУТЬ</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={async () => {
                if (users.length === 0) {
                  await fetchUsers();
                }
                setShowTransferModal(true);
              }}
              disabled={processing}
            >
              <Ionicons name="swap-horizontal" size={24} color="white" />
              <Text style={styles.actionButtonText}>ПЕРЕДАТЬ</Text>
            </TouchableOpacity>
          </>
        )}
        {!isAvailable && !isMyTool && (
          <View style={styles.notAvailableContainer}>
            <Ionicons name="lock-closed" size={24} color="#718096" />
            <Text style={styles.notAvailableText}>
              Инструмент занят другим пользователем
            </Text>
          </View>
        )}
      </View>

      <Modal
        visible={showTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTransferModal(false)}>
              <Text style={styles.modalCancel}>Отмена</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Передать инструмент</Text>
            <TouchableOpacity onPress={handleTransfer} disabled={processing}>
              <Text style={[styles.modalSave, processing && styles.modalSaveDisabled]}>
                {processing ? 'Передача...' : 'Передать'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>Выберите пользователя</Text>
            {users
              .filter(u => u.id !== user?.id)
              .map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.userOption,
                    transferUserId === u.id && styles.userOptionActive,
                  ]}
                  onPress={() => setTransferUserId(u.id)}
                >
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={24} color="#3182CE" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                  {transferUserId === u.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#3182CE" />
                  )}
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showReturnModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReturnModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReturnModal(false)}>
              <Text style={styles.modalCancel}>Отмена</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Вернуть инструмент</Text>
            <TouchableOpacity onPress={handleReturnConfirm} disabled={processing}>
              <Text style={[styles.modalSave, processing && styles.modalSaveDisabled]}>
                {processing ? 'Возврат...' : 'Вернуть'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>Выберите склад</Text>
            {warehouses.map((warehouse) => (
              <TouchableOpacity
                key={warehouse.id}
                style={[
                  styles.warehouseOption,
                  selectedWarehouseId === warehouse.id && styles.warehouseOptionActive,
                ]}
                onPress={() => setSelectedWarehouseId(warehouse.id)}
              >
                <View style={styles.warehouseIcon}>
                  <Ionicons name="business" size={24} color="#3182CE" />
                </View>
                <View style={styles.warehouseInfo}>
                  <Text style={styles.warehouseName}>{warehouse.name}</Text>
                  {warehouse.location && (
                    <Text style={styles.warehouseLocation}>{warehouse.location}</Text>
                  )}
                </View>
                {selectedWarehouseId === warehouse.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#3182CE" />
                )}
              </TouchableOpacity>
            ))}
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
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#718096',
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
    padding: 20,
    paddingBottom: 120,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  serial: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3182CE',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  statusContent: {
    marginLeft: 32,
  },
  statusLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
  },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonPrimary: {
    backgroundColor: '#3182CE',
  },
  actionButtonSecondary: {
    backgroundColor: '#EBF8FF',
    borderWidth: 2,
    borderColor: '#3182CE',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  actionButtonTextSecondary: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3182CE',
    letterSpacing: 1,
  },
  notAvailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  notAvailableText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#718096',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3182CE',
  },
  modalSaveDisabled: {
    color: '#CBD5E0',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userOptionActive: {
    borderWidth: 2,
    borderColor: '#3182CE',
  },
  userAvatar: {
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
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#718096',
  },
  warehouseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warehouseOptionActive: {
    borderWidth: 2,
    borderColor: '#3182CE',
  },
  warehouseIcon: {
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
    marginBottom: 4,
  },
  warehouseLocation: {
    fontSize: 14,
    color: '#718096',
  },
});
