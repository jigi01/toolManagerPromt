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
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Tool, User, Warehouse } from '../../types';
import { PERMISSIONS } from '../../constants/permissions';
import { useThemeColor } from '../../hooks/useThemeColor';

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

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const inputBackground = useThemeColor({}, 'inputBackground');

  if (authLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
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
      Toast.show({
        type: 'success',
        text1: 'Успех',
        text2: 'Инструмент взят',
      });
      fetchData();
      // Небольшая задержка перед возвратом для обновления данных
      setTimeout(() => router.back(), 100);
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
                Toast.show({
                  type: 'success',
                  text1: 'Успех',
                  text2: 'Инструмент возвращен на склад',
                });
                fetchData();
                setTimeout(() => router.back(), 100);
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
      Toast.show({
        type: 'success',
        text1: 'Успех',
        text2: 'Инструмент возвращен на склад',
      });
      fetchData();
      setTimeout(() => router.back(), 100);
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
      Toast.show({
        type: 'success',
        text1: 'Успех',
        text2: 'Инструмент передан',
      });
      fetchData();
      setTimeout(() => router.back(), 100);
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось передать инструмент');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (!tool) {
    return (
      <View style={[styles.centerContainer, { backgroundColor }]}>
        <Text style={[styles.errorText, { color: textSecondaryColor }]}>Инструмент не найден</Text>
      </View>
    );
  }

  const isMyTool = tool.currentUser?.id === user?.id;
  const isAvailable = !tool.currentUser;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.imageContainer, { backgroundColor: cardColor }]}>
          {tool.imageUrl ? (
            <Image source={{ uri: tool.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="construct" size={80} color={iconColor} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.name, { color: textColor }]}>{tool.name}</Text>

          {tool.serialNumber && (
            <Text style={[styles.serial, { color: textSecondaryColor }]}>SN: {tool.serialNumber}</Text>
          )}

          {tool.category && (
            <View style={[styles.categoryBadge, { backgroundColor: backgroundColor }]}>
              <Text style={[styles.categoryText, { color: primaryColor }]}>{tool.category.name}</Text>
            </View>
          )}

          {/* Цветной блок статуса */}
          {isAvailable ? (
            <View style={[styles.statusBanner, styles.statusAvailable]}>
              <View style={styles.statusBannerHeader}>
                <Ionicons name="checkmark-circle" size={32} color="white" />
                <Text style={styles.statusBannerTitle}>СВОБОДЕН</Text>
              </View>
              {tool.warehouse && (
                <Text style={styles.statusBannerSubtitle}>
                  На складе "{tool.warehouse.name}"
                </Text>
              )}
            </View>
          ) : isMyTool ? (
            <View style={[styles.statusBanner, styles.statusMine]}>
              <View style={styles.statusBannerHeader}>
                <Ionicons name="hand-right" size={32} color="white" />
                <Text style={styles.statusBannerTitle}>У ВАС</Text>
              </View>
              <Text style={styles.statusBannerSubtitle}>
                Вы взяли этот инструмент
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBanner, styles.statusBusy, { backgroundColor: primaryColor }]}>
              <View style={styles.statusBannerHeader}>
                <Ionicons name="person" size={32} color="white" />
                <Text style={styles.statusBannerTitle}>ЗАНЯТ</Text>
              </View>
              {tool.currentUser && (
                <Text style={styles.statusBannerSubtitle}>
                  У: {tool.currentUser.name}
                </Text>
              )}
            </View>
          )}

          {tool.description && (
            <View style={[styles.descriptionCard, { backgroundColor: cardColor }]}>
              <Text style={[styles.descriptionTitle, { color: textColor }]}>Описание</Text>
              <Text style={[styles.description, { color: textSecondaryColor }]}>{tool.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
        {isAvailable && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary, { backgroundColor: primaryColor }]}
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
              style={[
                styles.actionButton,
                styles.actionButtonSecondary,
                { backgroundColor: backgroundColor, borderColor: primaryColor }
              ]}
              onPress={handleReturn}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color={primaryColor} />
              ) : (
                <>
                  <Ionicons name="return-down-back" size={24} color={primaryColor} />
                  <Text style={[styles.actionButtonTextSecondary, { color: primaryColor }]}>ВЕРНУТЬ</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary, { backgroundColor: primaryColor }]}
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
            <Ionicons name="lock-closed" size={24} color={textSecondaryColor} />
            <Text style={[styles.notAvailableText, { color: textSecondaryColor }]}>
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
        <View style={[styles.modalContainer, { backgroundColor }]}>
          <View style={[styles.modalHeader, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowTransferModal(false)}>
              <Text style={[styles.modalCancel, { color: textSecondaryColor }]}>Отмена</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>Передать инструмент</Text>
            <TouchableOpacity onPress={handleTransfer} disabled={processing}>
              <Text style={[styles.modalSave, { color: primaryColor }, processing && styles.modalSaveDisabled]}>
                {processing ? 'Передача...' : 'Передать'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: textColor }]}>Выберите пользователя</Text>
            {users
              .filter(u => u.id !== user?.id)
              .map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.userOption,
                    { backgroundColor: cardColor },
                    transferUserId === u.id && { borderColor: primaryColor },
                  ]}
                  onPress={() => setTransferUserId(u.id)}
                >
                  <View style={[styles.userAvatar, { backgroundColor: backgroundColor }]}>
                    <Ionicons name="person" size={24} color={primaryColor} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: textColor }]}>{u.name}</Text>
                    <Text style={[styles.userEmail, { color: textSecondaryColor }]}>{u.email}</Text>
                  </View>
                  {transferUserId === u.id && (
                    <Ionicons name="checkmark-circle" size={24} color={primaryColor} />
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
        <View style={[styles.modalContainer, { backgroundColor }]}>
          <View style={[styles.modalHeader, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowReturnModal(false)}>
              <Text style={[styles.modalCancel, { color: textSecondaryColor }]}>Отмена</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>Вернуть инструмент</Text>
            <TouchableOpacity onPress={handleReturnConfirm} disabled={processing}>
              <Text style={[styles.modalSave, { color: primaryColor }, processing && styles.modalSaveDisabled]}>
                {processing ? 'Возврат...' : 'Вернуть'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: textColor }]}>Выберите склад</Text>
            {warehouses.map((warehouse) => (
              <TouchableOpacity
                key={warehouse.id}
                style={[
                  styles.warehouseOption,
                  { backgroundColor: cardColor },
                  selectedWarehouseId === warehouse.id && { borderColor: primaryColor },
                ]}
                onPress={() => setSelectedWarehouseId(warehouse.id)}
              >
                <View style={[styles.warehouseIcon, { backgroundColor: backgroundColor }]}>
                  <Ionicons name="business" size={24} color={primaryColor} />
                </View>
                <View style={styles.warehouseInfo}>
                  <Text style={[styles.warehouseName, { color: textColor }]}>{warehouse.name}</Text>
                  {warehouse.location && (
                    <Text style={[styles.warehouseLocation, { color: textSecondaryColor }]}>{warehouse.location}</Text>
                  )}
                </View>
                {selectedWarehouseId === warehouse.id && (
                  <Ionicons name="checkmark-circle" size={24} color={primaryColor} />
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
  },
  imageContainer: {
    width: '100%',
    height: 300,
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
    marginBottom: 8,
  },
  serial: {
    fontSize: 16,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBanner: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statusAvailable: {
    backgroundColor: '#38A169',
  },
  statusMine: {
    backgroundColor: '#ED8936',
  },
  statusBusy: {
    // backgroundColor set dynamically
  },
  statusBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  statusBannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  statusBannerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 48,
  },
  descriptionCard: {
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
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
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
    // color set dynamically
  },
  actionButtonSecondary: {
    borderWidth: 2,
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
    textAlign: 'center',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  warehouseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  warehouseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  warehouseLocation: {
    fontSize: 14,
  },
});
