import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Heading,
  VStack,
  Stack,
  Button,
  useToast,
  Spinner,
  Center,
  Card,
  CardBody,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Text,
  SimpleGrid,
  Switch,
  FormHelperText
} from '@chakra-ui/react';
import { FiPlus, FiGrid, FiList, FiSearch, FiX } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import ToolCard from '../components/ToolCard';
import ToolTable from '../components/ToolTable';
import EditToolModal from '../components/EditToolModal';
import TransferModal from '../components/TransferModal';
import CheckinModal from '../components/CheckinModal';
import { compressImage } from '../utils/imageCompression';
import { QrReader } from 'react-qr-reader';

const ToolsPage = () => {
  const [tools, setTools] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    description: '',
    imageUrl: '',
    warehouseId: '',
    price: '',
    categoryId: '',
    qrCode: ''
  });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editingTool, setEditingTool] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();
  const { user, hasPermission } = useAuthStore();
  const [showQrScanner, setShowQrScanner] = useState(false);

  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState(new Set());
  const { isOpen: isBulkTransferOpen, onOpen: onBulkTransferOpen, onClose: onBulkTransferClose } = useDisclosure();
  const { isOpen: isBulkCheckinOpen, onOpen: onBulkCheckinOpen, onClose: onBulkCheckinClose } = useDisclosure();

  // Import dynamically or assume it's installed. Using QrReader from react-qr-reader.
  // Note: We need a way to scan.
  // Let's create a simple Scan Modal or embed it.

  const scanLock = useRef(false);

  // Reset lock when opening scanner
  useEffect(() => {
    if (showQrScanner) {
      scanLock.current = false;
    }
  }, [showQrScanner]);

  const handleScan = (data) => {
    if (data && !scanLock.current) {
      scanLock.current = true; // Lock immediately

      const code = data?.text || data;
      setFormData(prev => ({ ...prev, qrCode: code }));
      setShowQrScanner(false);

      toast({
        title: 'QR-код отсканирован',
        status: 'success',
        duration: 2000,
        id: 'qr-scan-toast'
      });
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  const canCreate = hasPermission('TOOL_CREATE');
  const canUpdate = hasPermission('TOOL_UPDATE');
  const canDelete = hasPermission('TOOL_DELETE');
  const canTransfer = hasPermission('TOOL_TRANSFER');
  const canCheckin = hasPermission('TOOL_CHECKIN');
  const canManageAll = hasPermission('TOOL_MANAGE_ALL') || user?.role?.isBoss;

  useEffect(() => {
    fetchTools();
    fetchWarehouses();
    fetchCategories();
  }, [filterStatus, filterCategory, filterWarehouse, searchQuery]);

  const fetchTools = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('categoryId', filterCategory);
      if (filterWarehouse) params.append('warehouseId', filterWarehouse);
      if (searchQuery) params.append('search', searchQuery);

      const queryString = params.toString();
      const response = await api.get(`/tools${queryString ? `?${queryString}` : ''}`);
      setTools(response.data.tools);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error.response?.data?.error || 'Не удалось загрузить инструменты',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.warehouses);
    } catch (error) {
      console.error('Не удалось загрузить склады:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Не удалось загрузить категории:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем тип файла
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Неверный формат',
          description: 'Поддерживаются только изображения (JPG, PNG, GIF, WebP, SVG)',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Проверяем размер файла (макс 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB в байтах
      if (file.size > maxSize) {
        toast({
          title: 'Файл слишком большой',
          description: 'Максимальный размер изображения - 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setImageFile(file);

      // Показываем превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      // Сжимаем изображение перед загрузкой
      const compressedDataUrl = await compressImage(file, 1920, 1920, 0.8);
      return compressedDataUrl;
    } catch (error) {
      console.error('Ошибка сжатия изображения:', error);
      // В случае ошибки возвращаем оригинал
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleCreateTool = async (e) => {
    e.preventDefault();
    try {
      const formDataPayload = new FormData();
      formDataPayload.append('name', formData.name);
      formDataPayload.append('serialNumber', formData.serialNumber);
      if (formData.description) formDataPayload.append('description', formData.description);
      if (formData.warehouseId) formDataPayload.append('warehouseId', formData.warehouseId);
      if (formData.price) formDataPayload.append('price', formData.price);
      if (formData.categoryId) formDataPayload.append('categoryId', formData.categoryId);
      if (formData.qrCode) formDataPayload.append('qrCode', formData.qrCode);

      // If we have a file, append it
      if (imageFile) {
        formDataPayload.append('image', imageFile);
      } else if (formData.imageUrl) {
        // If user provided a URL string manually (backward compatibility or external URL)
        formDataPayload.append('imageUrl', formData.imageUrl);
      }

      await api.post('/tools', formDataPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Инструмент создан',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', serialNumber: '', description: '', imageUrl: '', warehouseId: '', price: '', categoryId: '', qrCode: '' });
      setImageFile(null);
      setImagePreview('');
      onClose();
      fetchTools();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось создать инструмент',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTool = async (toolId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот инструмент?')) return;

    try {
      await api.delete(`/tools/${toolId}`);
      toast({
        title: 'Инструмент удален',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTools();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось удалить инструмент',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTransfer = async (toolId, toUserId) => {
    try {
      await api.post(`/tools/${toolId}/transfer`, { toUserId });
      toast({
        title: 'Инструмент передан',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTools();
    } catch (error) {
      toast({
        title: 'Ошибка передачи',
        description: error.response?.data?.error || 'Не удалось передать инструмент',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCheckin = async (toolId, warehouseId) => {
    try {
      await api.post(`/tools/${toolId}/checkin`, { warehouseId });
      toast({
        title: 'Инструмент возвращен на склад',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTools();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось вернуть инструмент',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditTool = (tool) => {
    setEditingTool(tool);
    onEditOpen();
  };

  const handleEditSuccess = () => {
    fetchTools();
    onEditClose();
  };

  // Bulk Handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedToolIds(new Set()); // Clear selection when toggling
  };

  const handleSelectTool = (toolId, isSelected) => {
    const newSelected = new Set(selectedToolIds);
    if (isSelected) {
      newSelected.add(toolId);
    } else {
      newSelected.delete(toolId);
    }
    setSelectedToolIds(newSelected);
  };

  const handleBulkTransferSuccess = async (toUserId) => {
    try {
      await api.post('/tools/bulk-transfer', {
        toolIds: Array.from(selectedToolIds),
        toUserId
      });
      toast({
        title: 'Инструменты переданы',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      setSelectedToolIds(new Set());
      setIsSelectionMode(false);
      fetchTools();
      onBulkTransferClose();
    } catch (error) {
      toast({
        title: 'Ошибка массовой передачи',
        description: error.response?.data?.error || 'Не удалось передать инструменты',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleBulkCheckinSuccess = async (warehouseId) => {
    try {
      await api.post('/tools/bulk-checkin', {
        toolIds: Array.from(selectedToolIds),
        warehouseId
      });
      toast({
        title: 'Инструменты возвращены на склад',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      setSelectedToolIds(new Set());
      setIsSelectionMode(false);
      fetchTools();
      onBulkCheckinClose();
    } catch (error) {
      toast({
        title: 'Ошибка массового возврата',
        description: error.response?.data?.error || 'Не удалось вернуть инструменты',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }}>
        <Box>
          <Heading size="lg" mb={2}>
            Все Инструменты
          </Heading>
          <Text color="gray.600">
            Управление инвентарем компании
          </Text>
        </Box>
        <HStack>
          <Button
            onClick={toggleSelectionMode}
            variant={isSelectionMode ? "solid" : "outline"}
            colorScheme={isSelectionMode ? "blue" : "gray"}
          >
            {isSelectionMode ? "Отмена выбора" : "Выбрать..."}
          </Button>
          {canCreate && (
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen} w={{ base: 'full', md: 'auto' }}>
              Добавить Инструмент
            </Button>
          )}
        </HStack>
      </Stack>

      <VStack spacing={4} align="stretch">
        <HStack spacing={4}>
          <Box flex="1">
            <FormControl>
              <HStack>
                <Box position="relative" flex="1">
                  <Input
                    placeholder="Поиск по названию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    pl={10}
                  />
                  <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
                    <FiSearch color="gray" />
                  </Box>
                  {searchQuery && (
                    <Box
                      position="absolute"
                      right={3}
                      top="50%"
                      transform="translateY(-50%)"
                      cursor="pointer"
                      onClick={() => setSearchQuery('')}
                    >
                      <FiX color="gray" />
                    </Box>
                  )}
                </Box>
              </HStack>
            </FormControl>
          </Box>
          <HStack>
            <Button
              leftIcon={<FiGrid />}
              variant={viewMode === 'grid' ? 'solid' : 'ghost'}
              onClick={() => setViewMode('grid')}
              size="sm"
            >
              Карточки
            </Button>
            <Button
              leftIcon={<FiList />}
              variant={viewMode === 'table' ? 'solid' : 'ghost'}
              onClick={() => setViewMode('table')}
              size="sm"
            >
              Таблица
            </Button>
          </HStack>
        </HStack>

        <Stack direction={{ base: 'column', lg: 'row' }} spacing={4}>
          <Select
            placeholder="Все статусы"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            maxW={{ base: 'full', lg: '200px' }}
          >
            <option value="AVAILABLE">На складе</option>
            <option value="IN_USE">В использовании</option>
          </Select>

          <Select
            placeholder="Все категории"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            maxW={{ base: 'full', lg: '200px' }}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            placeholder="Все склады"
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            maxW={{ base: 'full', lg: '200px' }}
          >
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </Select>

          {(filterStatus || filterCategory || filterWarehouse || searchQuery) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFilterStatus('');
                setFilterCategory('');
                setFilterWarehouse('');
                setSearchQuery('');
              }}
            >
              Сбросить фильтры
            </Button>
          )}
        </Stack>
      </VStack>

      {viewMode === 'grid' ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 3 }} spacing={6}>
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onDelete={canDelete ? handleDeleteTool : null}
              onTransfer={canTransfer ? handleTransfer : null}
              onCheckin={canCheckin ? handleCheckin : null}
              canUpdate={canUpdate}
              onEdit={canUpdate ? handleEditTool : null}
              currentUserId={user?.id}
              canManageAll={canManageAll}
              selectable={isSelectionMode}
              isSelected={selectedToolIds.has(tool.id)}
              onSelect={handleSelectTool}
            />
          ))}
        </SimpleGrid>
      ) : (
        <ToolTable
          tools={tools}
          onDelete={canDelete ? handleDeleteTool : null}
          onTransfer={canTransfer ? handleTransfer : null}
          onCheckin={canCheckin ? handleCheckin : null}
          canUpdate={canUpdate}
          onEdit={canUpdate ? handleEditTool : null}
          currentUserId={user?.id}
          canManageAll={canManageAll}
        />
      )}

      {tools.length === 0 && (
        <Card>
          <CardBody>
            <Center py={10}>
              <VStack spacing={3}>
                <Text fontSize="lg" color="gray.500">
                  Нет инструментов
                </Text>
                {canCreate && (
                  <Button colorScheme="blue" onClick={onOpen}>
                    Добавить первый инструмент
                  </Button>
                )}
              </VStack>
            </Center>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Добавить Инструмент</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleCreateTool}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Название</FormLabel>
                  <Input
                    placeholder="Дрель Makita XF-200"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Серийный номер</FormLabel>
                  <Input
                    placeholder="SN-12345"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>QR-код</FormLabel>
                  <HStack>
                    <Input
                      placeholder="Сгенерируется автоматически, если пусто"
                      value={formData.qrCode}
                      onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                    />
                    <Button onClick={() => setShowQrScanner(!showQrScanner)} colorScheme={showQrScanner ? "red" : "gray"}>
                      {showQrScanner ? "Закрыть" : "Сканировать"}
                    </Button>
                  </HStack>
                  {showQrScanner && (
                    <Box mt={2} overflow="hidden" borderRadius="md">
                      <QrReader
                        onResult={(result, error) => {
                          if (!!result) {
                            handleScan(result?.text);
                            // Important: Stop scanning immediately to prevent loops
                            // QrReader might keep firing, so handleScan handles the state update
                          }
                          if (!!error) {
                            // console.info(error);
                          }
                        }}
                        constraints={{ facingMode: 'environment' }}
                        style={{ width: '100%' }}
                        scanDelay={500} // Scan delay in ms
                      />
                    </Box>
                  )}
                  <FormHelperText>
                    Оставьте пустым для авто-генерации. Или отсканируйте свой.
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Описание</FormLabel>
                  <Textarea
                    placeholder="Дополнительная информация..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Категория</FormLabel>
                  <Select
                    placeholder="Выберите категорию (необязательно)"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Цена</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <FormHelperText>
                    Необязательное поле
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Склад</FormLabel>
                  <Select
                    placeholder="Выберите склад (по умолчанию - основной)"
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                  >
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} {warehouse.isDefault && '(По умолчанию)'}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Изображение</FormLabel>
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={handleImageChange}
                    pt={1}
                  />
                  <FormHelperText>
                    Поддерживаемые форматы: JPG, PNG, GIF, WebP, SVG (макс. 5MB). Или введите URL изображения:
                  </FormHelperText>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    mt={2}
                  />
                </FormControl>

                {(imagePreview || formData.imageUrl) && (
                  <Box w="100%">
                    <Text fontSize="sm" mb={2}>Предпросмотр:</Text>
                    <Box
                      as="img"
                      src={imagePreview || formData.imageUrl}
                      alt="Preview"
                      maxH="200px"
                      objectFit="contain"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                    />
                  </Box>
                )}

                <Button type="submit" colorScheme="blue" width="100%">
                  Создать
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {editingTool && (
        <EditToolModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          tool={editingTool}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Bulk Action Bar */}
      {
        isSelectionMode && selectedToolIds.size > 0 && (
          <Box
            position="fixed"
            bottom="20px"
            left="50%"
            transform="translateX(-50%)"
            bg="white"
            p={4}
            borderRadius="lg"
            shadow="2xl"
            zIndex={100}
            border="1px solid"
            borderColor="gray.200"
          >
            <HStack spacing={4}>
              <Text fontWeight="bold">{selectedToolIds.size} выбрано</Text>
              {canTransfer && (
                <Button colorScheme="blue" size="sm" onClick={onBulkTransferOpen}>
                  Передать
                </Button>
              )}
              {canCheckin && (
                <Button colorScheme="green" size="sm" onClick={onBulkCheckinOpen}>
                  На склад
                </Button>
              )}
              <Button size="sm" onClick={() => setSelectedToolIds(new Set())}>
                Сброс
              </Button>
            </HStack>
          </Box>
        )
      }

      <TransferModal
        isOpen={isBulkTransferOpen}
        onClose={onBulkTransferClose}
        tool={null} // null for bulk
        selectedCount={selectedToolIds.size}
        onSuccess={handleBulkTransferSuccess}
        currentUserId={user?.id}
        canManageAll={canManageAll}
      />

      <CheckinModal
        isOpen={isBulkCheckinOpen}
        onClose={onBulkCheckinClose}
        tool={null} // null for bulk
        selectedCount={selectedToolIds.size}
        onSuccess={handleBulkCheckinSuccess}
      />
    </VStack >
  );
};

export default ToolsPage;
