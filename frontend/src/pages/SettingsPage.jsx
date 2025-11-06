import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Text,
  Card,
  CardBody,
  Spinner,
  Center
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const SettingsPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { hasPermission } = useAuthStore();

  const canCreate = hasPermission('TOOL_CREATE');
  const canUpdate = hasPermission('TOOL_UPDATE');
  const canDelete = hasPermission('TOOL_DELETE');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error.response?.data?.error || 'Не удалось загрузить категории',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryName('');
    onOpen();
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    onOpen();
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название категории не может быть пустым',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, { name: categoryName });
        toast({
          title: 'Категория обновлена',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/categories', { name: categoryName });
        toast({
          title: 'Категория создана',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      fetchCategories();
      onClose();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось сохранить категорию',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту категорию? Инструменты в этой категории не будут удалены, но категория у них будет сброшена.')) {
      return;
    }

    try {
      await api.delete(`/categories/${categoryId}`);
      toast({
        title: 'Категория удалена',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось удалить категорию',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Настройки
          </Heading>
          <Text color="gray.600">
            Управление категориями и другими параметрами системы
          </Text>
        </Box>

        <Tabs colorScheme="blue">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <FiTag />
                <Text>Категории</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Box>
                    <Heading size="md">Категории инструментов</Heading>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Создавайте и управляйте категориями для группировки инструментов
                    </Text>
                  </Box>
                  {canCreate && (
                    <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleOpenCreate}>
                      Добавить категорию
                    </Button>
                  )}
                </HStack>

                {loading ? (
                  <Center py={10}>
                    <Spinner size="xl" color="blue.500" />
                  </Center>
                ) : categories.length === 0 ? (
                  <Card>
                    <CardBody>
                      <Center py={10}>
                        <VStack spacing={3}>
                          <FiTag size={48} color="gray" />
                          <Text fontSize="lg" color="gray.500">
                            Нет категорий
                          </Text>
                          {canCreate && (
                            <Button colorScheme="blue" onClick={handleOpenCreate}>
                              Создать первую категорию
                            </Button>
                          )}
                        </VStack>
                      </Center>
                    </CardBody>
                  </Card>
                ) : (
                  <Card>
                    <CardBody overflowX="auto" p={0}>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Название</Th>
                            <Th>Инструментов</Th>
                            <Th>Дата создания</Th>
                            {(canUpdate || canDelete) && <Th>Действия</Th>}
                          </Tr>
                        </Thead>
                        <Tbody>
                          {categories.map((category) => (
                            <Tr key={category.id}>
                              <Td>
                                <HStack spacing={2}>
                                  <Badge colorScheme="purple" fontSize="sm">
                                    {category.name}
                                  </Badge>
                                </HStack>
                              </Td>
                              <Td>
                                <Badge colorScheme="blue" variant="subtle">
                                  {category._count?.tools || 0}
                                </Badge>
                              </Td>
                              <Td color="gray.600">
                                {new Date(category.createdAt).toLocaleDateString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </Td>
                              {(canUpdate || canDelete) && (
                                <Td>
                                  <HStack spacing={2}>
                                    {canUpdate && (
                                      <IconButton
                                        icon={<FiEdit2 />}
                                        size="sm"
                                        colorScheme="blue"
                                        variant="ghost"
                                        onClick={() => handleOpenEdit(category)}
                                        aria-label="Редактировать"
                                      />
                                    )}
                                    {canDelete && (
                                      <IconButton
                                        icon={<FiTrash2 />}
                                        size="sm"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => handleDelete(category.id)}
                                        aria-label="Удалить"
                                      />
                                    )}
                                  </HStack>
                                </Td>
                              )}
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Название категории</FormLabel>
              <Input
                placeholder="Например: Электроинструмент, Ручной инструмент"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                autoFocus
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Отмена
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={isSubmitting}
            >
              {editingCategory ? 'Сохранить' : 'Создать'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default SettingsPage;
