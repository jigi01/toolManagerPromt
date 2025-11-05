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
  SimpleGrid
} from '@chakra-ui/react';
import { FiPackage, FiGrid, FiList } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import ToolCard from '../components/ToolCard';
import ToolTable from '../components/ToolTable';
import EditToolModal from '../components/EditToolModal';

const DashboardEmployee = () => {
  const [myTools, setMyTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [editingTool, setEditingTool] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const toast = useToast();
  const { user, hasPermission } = useAuthStore();

  const canUpdate = hasPermission('TOOL_UPDATE');
  const canDelete = hasPermission('TOOL_DELETE');
  const canTransfer = hasPermission('TOOL_TRANSFER');
  const canCheckin = hasPermission('TOOL_CHECKIN');

  useEffect(() => {
    fetchMyTools();
  }, [user]);

  const fetchMyTools = async () => {
    try {
      const response = await api.get(`/tools?currentUserId=${user.id}`);
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

  const handleCheckin = async (toolId) => {
    try {
      await api.post(`/tools/${toolId}/checkin`);
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
