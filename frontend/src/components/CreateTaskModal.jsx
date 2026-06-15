import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  VStack,
  FormHelperText,
  CheckboxGroup,
  Checkbox,
  Stack,
  Text,
} from '@chakra-ui/react';
import useTaskStore from '../store/taskStore';
import api from '../services/api';

const CreateTaskModal = ({ isOpen, onClose }) => {
  const { createTask } = useTaskStore();
  const toast = useToast();
  
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    dueDate: '',
    assigneeId: '',
    requiredCategoryIds: [],
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchCategories();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.users);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriesChange = (values) => {
    setFormData((prev) => ({ ...prev, requiredCategoryIds: values }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Форматируем дату для ISO
    const payload = {
      ...formData,
      dueDate: new Date(formData.dueDate).toISOString()
    };

    const success = await createTask(payload);
    setIsSubmitting(false);

    if (success) {
      toast({
        title: 'Задача создана',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({
        title: '',
        description: '',
        address: '',
        dueDate: '',
        assigneeId: '',
        requiredCategoryIds: [],
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Создать новую задачу</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Название задачи</FormLabel>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Например: Монтаж оборудования"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Исполнитель</FormLabel>
                <Select
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleChange}
                  placeholder="Выберите сотрудника"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Адрес выполнения</FormLabel>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="ул. Пушкина, д. 10"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Срок сдачи (дедлайн)</FormLabel>
                <Input
                  type="datetime-local"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Описание работы</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Детали задачи..."
                />
              </FormControl>

              <FormControl>
                <FormLabel>Необходимые инструменты (виды)</FormLabel>
                {categories.length > 0 ? (
                  <CheckboxGroup
                    colorScheme="blue"
                    value={formData.requiredCategoryIds}
                    onChange={handleCategoriesChange}
                  >
                    <Stack spacing={2} direction="column" maxH="150px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md">
                      {categories.map((c) => (
                        <Checkbox key={c.id} value={c.id}>
                          {c.name}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                ) : (
                  <Text fontSize="sm" color="gray.500">Нет доступных категорий</Text>
                )}
                <FormHelperText>Выберите, что сотрудник должен взять с собой</FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
              Отмена
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
              Создать задачу
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateTaskModal;
