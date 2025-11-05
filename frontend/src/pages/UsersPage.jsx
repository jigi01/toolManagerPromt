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
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Tooltip,
  Code
} from '@chakra-ui/react';
import { FiMoreVertical, FiUserPlus, FiMail, FiTrash2, FiCopy } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isRoleModalOpen, onOpen: onRoleModalOpen, onClose: onRoleModalClose } = useDisclosure();
  const toast = useToast();
  const { user: currentUser, hasPermission } = useAuthStore();

  const canInvite = hasPermission('USER_INVITE');
  const canDelete = hasPermission('USER_DELETE');
  const canAssignRole = hasPermission('USER_ASSIGN_ROLE');

  useEffect(() => {
    fetchUsers();
    if (canInvite) {
      fetchInvitations();
    }
    if (canAssignRole) {
      fetchRoles();
    }
  }, [canInvite, canAssignRole]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error.response?.data?.error || 'Не удалось загрузить список пользователей',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await api.get('/invitations');
      setInvitations(response.data.invitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/invitations', {
        email: inviteEmail,
        roleId: inviteRoleId || null
      });
      
      const inviteLink = `${window.location.origin}/register?invite=${response.data.invitation.token}`;
      
      toast({
        title: 'Приглашение создано',
        description: 'Ссылка скопирована в буфер обмена',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigator.clipboard.writeText(inviteLink);
      
      setInviteEmail('');
      setInviteRoleId('');
      onClose();
      fetchInvitations();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось создать приглашение',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteInvitation = async (invitationId) => {
    if (!confirm('Вы уверены, что хотите удалить это приглашение?')) return;

    try {
      await api.delete(`/invitations/${invitationId}`);
      toast({
        title: 'Приглашение удалено',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchInvitations();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось удалить приглашение',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCopyInviteLink = (token) => {
    const inviteLink = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Ссылка скопирована',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
      await api.delete(`/users/${userId}`);
      toast({
        title: 'Пользователь удален',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось удалить пользователя',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role?.id || '');
    onRoleModalOpen();
  };

  const handleAssignRole = async () => {
    try {
      await api.put(`/roles/assign/${selectedUser.id}`, { roleId: selectedRole });
      toast({
        title: 'Роль назначена',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onRoleModalClose();
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось назначить роль',
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
      <HStack justify="space-between">
        <Box>
          <Heading size="lg" mb={2}>
            Управление Сотрудниками
          </Heading>
          <Text color="gray.600">
            Список всех пользователей компании
          </Text>
        </Box>
        {canInvite && (
          <Button leftIcon={<FiUserPlus />} colorScheme="blue" onClick={onOpen}>
            Пригласить сотрудника
          </Button>
        )}
      </HStack>

      <Tabs>
        <TabList>
          <Tab>Сотрудники ({users.length})</Tab>
          {canInvite && <Tab>Приглашения ({invitations.length})</Tab>}
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
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
                          <Badge colorScheme={user.role?.isBoss ? 'purple' : 'blue'}>
                            {user.role?.name || 'Без роли'}
                          </Badge>
                        </Td>
                        <Td>{user._count?.currentTools || 0}</Td>
                        <Td>{formatDate(user.createdAt)}</Td>
                        <Td>
                          {user.id !== currentUser?.id && !user.role?.isBoss && (
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
                                {canAssignRole && (
                                  <MenuItem onClick={() => handleOpenRoleModal(user)}>
                                    Назначить роль
                                  </MenuItem>
                                )}
                                {canDelete && (
                                  <MenuItem
                                    icon={<FiTrash2 />}
                                    color="red.500"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    Удалить
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
          </TabPanel>

          {canInvite && (
            <TabPanel px={0}>
              <Card>
                <CardBody>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Email</Th>
                        <Th>Роль</Th>
                        <Th>Истекает</Th>
                        <Th>Статус</Th>
                        <Th>Действия</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {invitations.map((invitation) => (
                        <Tr key={invitation.id}>
                          <Td>{invitation.email}</Td>
                          <Td>
                            {invitation.role?.name || 'Без роли'}
                          </Td>
                          <Td>{formatDate(invitation.expiresAt)}</Td>
                          <Td>
                            {invitation.usedAt ? (
                              <Badge colorScheme="green">Использовано</Badge>
                            ) : new Date(invitation.expiresAt) < new Date() ? (
                              <Badge colorScheme="red">Истекло</Badge>
                            ) : (
                              <Badge colorScheme="blue">Активно</Badge>
                            )}
                          </Td>
                          <Td>
                            <HStack>
                              <Tooltip label="Скопировать ссылку">
                                <IconButton
                                  icon={<FiCopy />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyInviteLink(invitation.token)}
                                />
                              </Tooltip>
                              <IconButton
                                icon={<FiTrash2 />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeleteInvitation(invitation.id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Пригласить сотрудника</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleCreateInvitation}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </FormControl>

                {roles.length > 0 && (
                  <FormControl>
                    <FormLabel>Роль (опционально)</FormLabel>
                    <Select
                      placeholder="Без роли"
                      value={inviteRoleId}
                      onChange={(e) => setInviteRoleId(e.target.value)}
                    >
                      {roles.filter(r => !r.isBoss).map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Button type="submit" colorScheme="blue" width="100%">
                  Создать приглашение
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isRoleModalOpen} onClose={onRoleModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Назначить роль</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                Пользователь: <strong>{selectedUser?.name}</strong>
              </Text>
              <FormControl isRequired>
                <FormLabel>Роль</FormLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">Без роли</option>
                  {roles.filter(r => !r.isBoss).map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRoleModalClose}>
              Отмена
            </Button>
            <Button colorScheme="blue" onClick={handleAssignRole}>
              Назначить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default UsersPage;
