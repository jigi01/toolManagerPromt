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

const CheckinModal = ({ isOpen, onClose, tool, onSuccess }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchWarehouses();
    }
  }, [isOpen]);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.warehouses);
      
      const defaultWarehouse = response.data.warehouses.find(w => w.isDefault);
      if (defaultWarehouse) {
        setSelectedWarehouseId(defaultWarehouse.id);
      }
    } catch (error) {
      toast({
        title: 'Ошибка загрузки складов',
        description: error.response?.data?.error || 'Не удалось загрузить список складов',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedWarehouseId) {
      toast({
        title: 'Ошибка',
        description: 'Выберите склад',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setSubmitting(true);
    onSuccess(selectedWarehouseId);
    setSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setSelectedWarehouseId('');
    setLoading(true);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Вернуть на склад</ModalHeader>
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
                <FormLabel>Выберите склад</FormLabel>
                <Select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} {warehouse.isDefault && '(По умолчанию)'}
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
            colorScheme="green" 
            onClick={handleSubmit}
            isLoading={submitting}
            isDisabled={loading || !selectedWarehouseId}
          >
            Вернуть на склад
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CheckinModal;
