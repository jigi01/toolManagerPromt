import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
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
  Button,
  HStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { FiMoreVertical, FiUserCheck, FiUser } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить список пользователей',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/users/role/${userId}`, { role: newRole });
      toast({
        title: 'Роль изменена',
        description: `Роль пользователя успешно изменена на ${newRole === 'ADMIN' ? 'Администратор' : 'Сотрудник'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось изменить роль',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="lg" mb={2}>
          Управление Сотрудниками
        </Heading>
        <Text color="gray.600">
          Список всех зарегистрированных пользователей
        </Text>
      </Box>

      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Пользователь</Th>
                <Th>Email</Th>
                <Th>Роль</Th>
                <Th>Инструментов</Th>
                <Th>Дата регистрации</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={user.name} />
                      <Text fontWeight="medium">{user.name}</Text>
                    </HStack>
                  </Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Badge colorScheme={user.role === 'ADMIN' ? 'purple' : 'blue'}>
                      {user.role === 'ADMIN' ? 'Администратор' : 'Сотрудник'}
                    </Badge>
                  </Td>
                  <Td>{user._count?.toolsOwned || 0}</Td>
                  <Td>{formatDate(user.createdAt)}</Td>
                  <Td>
                    {user.id !== currentUser?.id && (
                      <Menu>
                        <MenuButton
                          as={Button}
                          size="sm"
                          variant="ghost"
                          rightIcon={<FiMoreVertical />}
                        >
                          Действия
                        </MenuButton>
                        <MenuList>
                          {user.role === 'EMPLOYEE' ? (
                            <MenuItem
                              icon={<FiUserCheck />}
                              onClick={() => handleChangeRole(user.id, 'ADMIN')}
                            >
                              Сделать Администратором
                            </MenuItem>
                          ) : (
                            <MenuItem
                              icon={<FiUser />}
                              onClick={() => handleChangeRole(user.id, 'EMPLOYEE')}
                            >
                              Сделать Сотрудником
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default UsersPage;
