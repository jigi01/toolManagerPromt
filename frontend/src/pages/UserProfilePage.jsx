import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  Spinner,
  Center,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Button,
  SimpleGrid,
  Divider,
  Icon,
  List,
  ListItem,
  ListIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input
} from '@chakra-ui/react';
import { FiArrowLeft, FiTool, FiCheckCircle, FiClock, FiMapPin, FiCalendar, FiEdit, FiPhone } from 'react-icons/fi';
import api from '../services/api';

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { user: currentUser } = useAuthStore();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${id}`);
      setUser(response.data.user);
      setEditName(response.data.user.name);
      setEditPhone(response.data.user.phone || '');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось загрузить профиль сотрудника',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await api.put(`/users/${id}`, {
        name: editName,
        phone: editPhone
      });
      
      setUser({ ...user, name: response.data.user.name, phone: response.data.user.phone });
      toast({
        title: 'Успешно',
        description: 'Профиль обновлен',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onEditClose();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось обновить профиль',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Button 
          leftIcon={<FiArrowLeft />} 
          variant="ghost" 
          onClick={() => navigate('/users')}
          mb={4}
        >
          Назад к списку
        </Button>
      </Box>

      <Card>
        <CardBody>
          <HStack spacing={6} align="start" flexDirection={{ base: 'column', md: 'row' }}>
            <Avatar size="2xl" name={user.name} src={user.avatarUrl} />
            <VStack align="start" spacing={3} flex={1}>
              <Heading size="lg">{user.name}</Heading>
              <Text color="gray.500" fontSize="lg">{user.email}</Text>
              
              <HStack mt={2} flexWrap="wrap" gap={4}>
                <Badge colorScheme={user.role?.isBoss ? 'purple' : 'blue'} fontSize="sm" px={2} py={1} borderRadius="md">
                  {user.role?.name || 'Без роли'}
                </Badge>
                
                {user.phone && (
                  <HStack color="gray.600" fontSize="sm">
                    <Icon as={FiPhone} />
                    <Text>{user.phone}</Text>
                  </HStack>
                )}

                <Text color="gray.400" fontSize="sm">
                  Зарегистрирован: {formatDate(user.createdAt)}
                </Text>
              </HStack>
            </VStack>
            
            {currentUser?.id === user.id && (
              <Button leftIcon={<FiEdit />} onClick={onEditOpen} variant="outline" size="sm">
                Редактировать
              </Button>
            )}
          </HStack>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card>
          <CardHeader pb={0}>
            <HStack>
              <Icon as={FiTool} color="blue.500" />
              <Heading size="md">Инструменты на руках ({user.currentTools?.length || 0})</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            {user.currentTools?.length > 0 ? (
              <VStack align="stretch" spacing={4}>
                {user.currentTools.map(tool => (
                  <Box key={tool.id} p={3} borderWidth="1px" borderRadius="md" _hover={{ bg: 'gray.50', cursor: 'pointer' }} onClick={() => navigate(`/tools/${tool.id}`)}>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{tool.name}</Text>
                        <Text fontSize="sm" color="gray.500">SN: {tool.serialNumber}</Text>
                      </VStack>
                      <Badge colorScheme="green">На руках</Badge>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500" py={4} textAlign="center">Нет выданных инструментов</Text>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader pb={0}>
            <HStack>
              <Icon as={FiCheckCircle} color="purple.500" />
              <Heading size="md">Текущие задачи ({user.assignedTasks?.length || 0})</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            {user.assignedTasks?.length > 0 ? (
              <List spacing={4}>
                {user.assignedTasks.map(task => (
                  <ListItem key={task.id} p={3} borderWidth="1px" borderRadius="md">
                    <VStack align="start" spacing={2}>
                      <HStack justify="space-between" w="100%">
                        <Text fontWeight="bold">{task.title}</Text>
                        <Badge colorScheme={
                          task.status === 'COMPLETED' ? 'green' :
                          task.status === 'IN_PROGRESS' ? 'blue' :
                          task.status === 'CANCELLED' ? 'red' : 'orange'
                        }>
                          {task.status === 'PENDING' && 'В ожидании'}
                          {task.status === 'IN_PROGRESS' && 'В работе'}
                          {task.status === 'COMPLETED' && 'Выполнена'}
                          {task.status === 'CANCELLED' && 'Отменена'}
                        </Badge>
                      </HStack>
                      
                      <HStack fontSize="sm" color="gray.600" w="100%">
                        <Icon as={FiMapPin} />
                        <Text isTruncated>{task.address}</Text>
                      </HStack>
                      
                      <HStack fontSize="sm" color="gray.600" w="100%">
                        <Icon as={FiCalendar} />
                        <Text>Дедлайн: {formatDate(task.dueDate)}</Text>
                      </HStack>
                    </VStack>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Text color="gray.500" py={4} textAlign="center">Нет назначенных задач</Text>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Редактировать профиль</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Имя</FormLabel>
                <Input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Иван Петров"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Телефон</FormLabel>
                <Input 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose} isDisabled={saving}>
              Отмена
            </Button>
            <Button colorScheme="blue" onClick={handleSaveProfile} isLoading={saving}>
              Сохранить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default UserProfilePage;
