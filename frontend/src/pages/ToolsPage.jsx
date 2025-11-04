import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Button,
  useToast,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
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
  IconButton,
  Select,
  Text
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiSend } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import TransferToolModal from '../components/TransferToolModal';

const ToolsPage = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', serialNumber: '', description: '' });
  const [selectedTool, setSelectedTool] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isTransferOpen, onOpen: onTransferOpen, onClose: onTransferClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchTools();
  }, [filterStatus]);

  const fetchTools = async () => {
    try {
      const queryParams = filterStatus ? `?status=${filterStatus}` : '';
      const response = await api.get(`/tools${queryParams}`);
      setTools(response.data.tools);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить инструменты',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTool = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tools', formData);
      toast({
        title: 'Инструмент создан',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', serialNumber: '', description: '' });
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

  const handleTransferClick = (tool) => {
    setSelectedTool(tool);
    onTransferOpen();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      AVAILABLE: { text: 'На складе', color: 'green' },
      IN_USE: { text: 'В использовании', color: 'blue' },
      MAINTENANCE: { text: 'На обслуживании', color: 'orange' }
    };
    const { text, color } = statusMap[status] || { text: status, color: 'gray' };
    return <Badge colorScheme={color}>{text}</Badge>;
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
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
          Добавить Инструмент
        </Button>
      </HStack>

      <HStack>
        <Select
          placeholder="Все статусы"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          maxW="250px"
        >
          <option value="AVAILABLE">На складе</option>
          <option value="IN_USE">В использовании</option>
          <option value="MAINTENANCE">На обслуживании</option>
        </Select>
      </HStack>

      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Название</Th>
                <Th>Серийный номер</Th>
                <Th>Статус</Th>
                <Th>Владелец</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tools.map((tool) => (
                <Tr key={tool.id}>
                  <Td fontWeight="medium">{tool.name}</Td>
                  <Td>
                    <Text fontFamily="mono" fontSize="sm">
                      {tool.serialNumber}
                    </Text>
                  </Td>
                  <Td>{getStatusBadge(tool.status)}</Td>
                  <Td>
                    {tool.currentOwner ? tool.currentOwner.name : '—'}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        as={RouterLink}
                        to={`/tools/${tool.id}`}
                        size="sm"
                        variant="outline"
                      >
                        Детали
                      </Button>
                      {tool.status === 'AVAILABLE' && (
                        <Button
                          size="sm"
                          leftIcon={<FiSend />}
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => handleTransferClick(tool)}
                        >
                          Выдать
                        </Button>
                      )}
                      <IconButton
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteTool(tool.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
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

                <Button type="submit" colorScheme="blue" width="100%">
                  Создать
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {selectedTool && (
        <TransferToolModal
          isOpen={isTransferOpen}
          onClose={onTransferClose}
          tool={selectedTool}
          onSuccess={() => {
            fetchTools();
            onTransferClose();
          }}
        />
      )}
    </VStack>
  );
};

export default ToolsPage;
