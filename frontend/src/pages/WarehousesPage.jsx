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
  Text,
  Badge,
  SimpleGrid,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Switch,
  Tooltip
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { useRef } from 'react';

const WarehousesPage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', isDefault: false });
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const cancelRef = useRef();
  const toast = useToast();
  const { hasPermission } = useAuthStore();

  const canCreate = hasPermission('WAREHOUSE_CREATE');
  const canUpdate = hasPermission('WAREHOUSE_UPDATE');
  const canDelete = hasPermission('WAREHOUSE_DELETE');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.warehouses);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error.response?.data?.error || 'Не удалось загрузить склады',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warehouses', formData);
      toast({
        title: 'Склад создан',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', isDefault: false });
      onClose();
      fetchWarehouses();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось создать склад',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditWarehouse = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/warehouses/${editingWarehouse.id}`, {
        name: formData.name,
        isDefault: formData.isDefault
      });
      toast({
        title: 'Склад обновлен',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', isDefault: false });
      setEditingWarehouse(null);
      onEditClose();
      fetchWarehouses();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось обновить склад',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteWarehouse = async () => {
    try {
      await api.delete(`/warehouses/${deletingWarehouse.id}`);
      toast({
        title: 'Склад удален',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDeletingWarehouse(null);
      onDeleteClose();
      fetchWarehouses();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось удалить склад',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openEditModal = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      isDefault: warehouse.isDefault
    });
    onEditOpen();
  };

  const openDeleteDialog = (warehouse) => {
    setDeletingWarehouse(warehouse);
    onDeleteOpen();
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
            Склады
          </Heading>
          <Text color="gray.600">
            Управление складами компании
          </Text>
        </Box>
        {canCreate && (
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
            Добавить Склад
          </Button>
        )}
      </HStack>

      {warehouses.length === 0 ? (
        <Card>
          <CardBody>
            <Center py={10}>
              <VStack spacing={3}>
                <Text fontSize="lg" color="gray.500">
                  Нет складов
                </Text>
                {canCreate && (
                  <Button colorScheme="blue" onClick={onOpen}>
                    Добавить первый склад
                  </Button>
                )}
              </VStack>
            </Center>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} variant="outline">
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <HStack>
                      <Box 
                        p={2} 
                        bg="blue.50" 
                        borderRadius="md"
                      >
                        <FiPackage size={24} color="#3182CE" />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="lg">
                          {warehouse.name}
                        </Text>
                        {warehouse.isDefault && (
                          <Badge colorScheme="green" fontSize="xs">
                            По умолчанию
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                    <HStack>
                      {canUpdate && (
                        <Tooltip label="Редактировать">
                          <IconButton
                            icon={<FiEdit2 />}
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(warehouse)}
                          />
                        </Tooltip>
                      )}
                      {canDelete && !warehouse.isDefault && (
                        <Tooltip label="Удалить">
                          <IconButton
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => openDeleteDialog(warehouse)}
                          />
                        </Tooltip>
                      )}
                    </HStack>
                  </HStack>

                  <Box 
                    p={3} 
                    bg="gray.50" 
                    borderRadius="md"
                  >
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Инструментов:
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="blue.600">
                        {warehouse._count?.tools || 0}
                      </Text>
                    </HStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Модальное окно создания склада */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Добавить Склад</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleCreateWarehouse}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Название</FormLabel>
                  <Input
                    placeholder="Название склада"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>
                    Сделать складом по умолчанию
                  </FormLabel>
                  <Switch
                    isChecked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                </FormControl>

                <Button type="submit" colorScheme="blue" width="100%">
                  Создать
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Модальное окно редактирования склада */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Редактировать Склад</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleEditWarehouse}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Название</FormLabel>
                  <Input
                    placeholder="Название склада"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>
                    Сделать складом по умолчанию
                  </FormLabel>
                  <Switch
                    isChecked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                </FormControl>

                <Button type="submit" colorScheme="blue" width="100%">
                  Сохранить
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Диалог удаления склада */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Удалить склад
            </AlertDialogHeader>

            <AlertDialogBody>
              Вы уверены, что хотите удалить склад "{deletingWarehouse?.name}"?
              Это действие нельзя отменить.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Отмена
              </Button>
              <Button colorScheme="red" onClick={handleDeleteWarehouse} ml={3}>
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};

export default WarehousesPage;
