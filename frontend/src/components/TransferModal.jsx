import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Text,
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react';
import api from '../services/api';

const TransferModal = ({ isOpen, onClose, tool, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки пользователей',
        description: error.response?.data?.error || 'Не удалось загрузить список пользователей',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Ошибка',
        description: 'Выберите получателя',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setSubmitting(true);
    onSuccess(selectedUserId);
    setSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setSelectedUserId('');
    setLoading(true);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Передать инструмент</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <Center py={8}>
              <Spinner />
            </Center>
          ) : (
            <VStack spacing={4} align="stretch">
              <Text>
                <strong>Инструмент:</strong> {tool.name}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Серийный номер: {tool.serialNumber}
              </Text>

              <FormControl isRequired>
                <FormLabel>Выберите получателя</FormLabel>
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
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Отмена
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={submitting}
            isDisabled={loading || !selectedUserId}
          >
            Передать
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TransferModal;
