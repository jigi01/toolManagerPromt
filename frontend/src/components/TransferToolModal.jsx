import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Button,
  useToast,
  Textarea,
  HStack,
  Text,
  Divider
} from '@chakra-ui/react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const TransferToolModal = ({ isOpen, onClose, tool, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('assign');
  const toast = useToast();
  const { user: currentUser, isAdmin } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (tool.status === 'AVAILABLE') {
        setAction('assign');
      } else if (tool.currentOwnerId === currentUser?.id) {
        setAction('transfer');
      }
    }
  }, [isOpen, tool]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users.filter(u => u.id !== tool.currentOwnerId));
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список пользователей',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint = '';
      let data = {};

      if (action === 'assign') {
        endpoint = '/transfer/assign';
        data = { toolId: tool.id, toUserId: parseInt(selectedUserId), notes };
      } else if (action === 'return') {
        endpoint = '/transfer/return';
        data = { toolId: tool.id };
      } else if (action === 'transfer') {
        endpoint = '/transfer/user-to-user';
        data = { toolId: tool.id, toUserId: parseInt(selectedUserId), notes };
      }

      await api.post(endpoint, data);

      toast({
        title: 'Успешно!',
        description: 'Операция выполнена успешно',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setSelectedUserId('');
      setNotes('');
      onSuccess();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось выполнить операцию',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    setLoading(true);
    try {
      await api.post('/transfer/return', { toolId: tool.id });
      toast({
        title: 'Успешно!',
        description: 'Инструмент возвращен на склад',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось вернуть инструмент',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {tool.status === 'AVAILABLE' ? 'Выдать инструмент' : 'Передать инструмент'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <Text fontSize="sm" color="gray.600">
              <strong>Инструмент:</strong> {tool.name} ({tool.serialNumber})
            </Text>

            {tool.status === 'IN_USE' && tool.currentOwnerId === currentUser?.id && (
              <>
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Передать сотруднику</FormLabel>
                      <Select
                        placeholder="Выберите сотрудника"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                      >
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Примечание (опционально)</FormLabel>
                      <Textarea
                        placeholder="Дополнительная информация..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </FormControl>

                    <HStack w="100%" spacing={2}>
                      <Button
                        type="submit"
                        colorScheme="blue"
                        width="100%"
                        isLoading={loading}
                      >
                        Передать
                      </Button>
                      <Button
                        colorScheme="green"
                        width="100%"
                        onClick={handleReturn}
                        isLoading={loading}
                      >
                        Вернуть на склад
                      </Button>
                    </HStack>
                  </VStack>
                </form>
              </>
            )}

            {tool.status === 'AVAILABLE' && isAdmin && (
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Выдать сотруднику</FormLabel>
                    <Select
                      placeholder="Выберите сотрудника"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Примечание (опционально)</FormLabel>
                    <Textarea
                      placeholder="Дополнительная информация..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="100%"
                    isLoading={loading}
                  >
                    Выдать
                  </Button>
                </VStack>
              </form>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TransferToolModal;
