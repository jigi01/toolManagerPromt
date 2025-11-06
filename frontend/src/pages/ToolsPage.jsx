import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
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
import { FiPlus, FiGrid, FiList } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import ToolCard from '../components/ToolCard';
import ToolTable from '../components/ToolTable';
import EditToolModal from '../components/EditToolModal';
import { compressImage } from '../utils/imageCompression';

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
    categoryId: ''
  });
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editingTool, setEditingTool] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();
  const { user, hasPermission } = useAuthStore();

  const canCreate = hasPermission('TOOL_CREATE');
  const canUpdate = hasPermission('TOOL_UPDATE');
  const canDelete = hasPermission('TOOL_DELETE');
  const canTransfer = hasPermission('TOOL_TRANSFER');
  const canCheckin = hasPermission('TOOL_CHECKIN');

  useEffect(() => {
    fetchTools();
    fetchWarehouses();
    fetchCategories();
  }, [filterStatus]);

  const fetchTools = async () => {
    try {
      const queryParams = filterStatus ? `?status=${filterStatus}` : '';
      const response = await api.get(`/tools${queryParams}`);
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
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        ...formData,
        imageUrl,
        price: formData.price ? parseFloat(formData.price) : null,
        categoryId: formData.categoryId || null
      };

      await api.post('/tools', payload);
      toast({
        title: 'Инструмент создан',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', serialNumber: '', description: '', imageUrl: '', warehouseId: '', price: '', categoryId: '' });
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

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      <HStack justify="space-between">
        <Box>
          <Heading size="lg" mb={2}>
            Все Инструменты
          </Heading>
          <Text color="gray.600">
            Управление инвентарем компании
          </Text>
        </Box>
        {canCreate && (
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
            Добавить Инструмент
          </Button>
        )}
      </HStack>

      <HStack justify="space-between">
        <Select
          placeholder="Все статусы"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          maxW="250px"
        >
          <option value="AVAILABLE">На складе</option>
          <option value="IN_USE">В использовании</option>
        </Select>

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

      {viewMode === 'grid' ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
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
    </VStack>
  );
};

export default ToolsPage;
