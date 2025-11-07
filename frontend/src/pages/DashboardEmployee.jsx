import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Text,
  useToast,
  Spinner,
  Center,
  Button,
  Card,
  CardBody,
  HStack,
  SimpleGrid,
  Input,
  FormControl,
  Select
} from '@chakra-ui/react';
import { FiPackage, FiGrid, FiList, FiSearch, FiX } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import ToolCard from '../components/ToolCard';
import ToolTable from '../components/ToolTable';
import EditToolModal from '../components/EditToolModal';

const DashboardEmployee = () => {
  const [myTools, setMyTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [editingTool, setEditingTool] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const toast = useToast();
  const { user, hasPermission } = useAuthStore();

  const canUpdate = hasPermission('TOOL_UPDATE');
  const canDelete = hasPermission('TOOL_DELETE');
  const canTransfer = hasPermission('TOOL_TRANSFER');
  const canCheckin = hasPermission('TOOL_CHECKIN');

  useEffect(() => {
    fetchMyTools();
    fetchCategories();
  }, [user, searchQuery, filterCategory]);

  const fetchMyTools = async () => {
    try {
      const params = new URLSearchParams();
      params.append('currentUserId', user.id);
      if (filterCategory) params.append('categoryId', filterCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const queryString = params.toString();
      const response = await api.get(`/tools?${queryString}`);
      setMyTools(response.data.tools);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить ваши инструменты',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
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
      fetchMyTools();
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
      fetchMyTools();
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
      fetchMyTools();
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
    setIsEditOpen(true);
  };

  const handleEditSuccess = () => {
    fetchMyTools();
    setIsEditOpen(false);
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
            Мои Инструменты
          </Heading>
          <Text color="gray.600">
            Инструменты, которые числятся за вами
          </Text>
        </Box>
        {myTools.length > 0 && (
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
        )}
      </HStack>

      {myTools.length > 0 && (
        <VStack spacing={4} align="stretch">
          <HStack spacing={4}>
            <Box flex="1">
              <FormControl>
                <Box position="relative">
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
              </FormControl>
            </Box>
            <Select
              placeholder="Все категории"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              maxW="250px"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {(filterCategory || searchQuery) && (
              <Button
                size="md"
                variant="ghost"
                onClick={() => {
                  setFilterCategory('');
                  setSearchQuery('');
                }}
              >
                Сбросить
              </Button>
            )}
          </HStack>
        </VStack>
      )}

      {myTools.length === 0 ? (
        <Card>
          <CardBody>
            <Center py={10}>
              <VStack spacing={4}>
                <FiPackage size={48} color="gray" />
                <Text color="gray.500" fontSize="lg">
                  У вас пока нет инструментов
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Инструменты появятся здесь, когда администратор выдаст их вам
                </Text>
              </VStack>
            </Center>
          </CardBody>
        </Card>
      ) : viewMode === 'grid' ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
          {myTools.map((tool) => (
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
          tools={myTools}
          onDelete={canDelete ? handleDeleteTool : null}
          onTransfer={canTransfer ? handleTransfer : null}
          onCheckin={canCheckin ? handleCheckin : null}
          canUpdate={canUpdate}
          onEdit={canUpdate ? handleEditTool : null}
          currentUserId={user?.id}
        />
      )}

      {editingTool && (
        <EditToolModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          tool={editingTool}
          onSuccess={handleEditSuccess}
        />
      )}
    </VStack>
  );
};

export default DashboardEmployee;
