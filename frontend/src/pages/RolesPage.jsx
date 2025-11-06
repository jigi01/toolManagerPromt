import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Stack,
  Badge,
  Text,
  Divider
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const PERMISSIONS_BY_CATEGORY = [
  {
    category: '👥 Пользователи и роли',
    description: 'Управление сотрудниками и их правами',
    permissions: [
      { value: 'USER_READ', label: 'Просмотр списка пользователей' },
      { value: 'USER_INVITE', label: 'Приглашение новых пользователей' },
      { value: 'USER_ASSIGN_ROLE', label: 'Назначение ролей пользователям' },
      { value: 'USER_DELETE', label: 'Удаление пользователей' },
      { value: 'ROLE_MANAGE', label: 'Управление ролями (создание, редактирование, удаление)' }
    ]
  },
  {
    category: '🔧 Инструменты',
    description: 'CRUD операции с инструментами',
    permissions: [
      { value: 'TOOL_READ', label: 'Просмотр инструментов' },
      { value: 'TOOL_CREATE', label: 'Создание новых инструментов' },
      { value: 'TOOL_UPDATE', label: 'Редактирование инструментов' },
      { value: 'TOOL_DELETE', label: 'Удаление инструментов' }
    ]
  },
  {
    category: '📁 Категории',
    description: 'Управление категориями инструментов',
    permissions: [
      { value: 'TOOL_READ', label: 'Просмотр категорий (требуется для просмотра инструментов)' },
      { value: 'TOOL_CREATE', label: 'Создание категорий' },
      { value: 'TOOL_UPDATE', label: 'Редактирование категорий' },
      { value: 'TOOL_DELETE', label: 'Удаление категорий' }
    ]
  },
  {
    category: '🔄 Операции с инструментами',
    description: 'Передача и прием инструментов',
    permissions: [
      { value: 'TOOL_TRANSFER', label: 'Передача инструментов другим сотрудникам' },
      { value: 'TOOL_CHECKIN', label: 'Возврат инструментов на склад' }
    ]
  },
  {
    category: '📦 Склады',
    description: 'Управление складами',
    permissions: [
      { value: 'WAREHOUSE_READ', label: 'Просмотр складов' },
      { value: 'WAREHOUSE_CREATE', label: 'Создание складов' },
      { value: 'WAREHOUSE_UPDATE', label: 'Редактирование складов' },
      { value: 'WAREHOUSE_DELETE', label: 'Удаление складов' }
    ]
  }
];

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();
  const { isBoss } = useAuthStore();

  useEffect(() => {
    if (!isBoss) {
      navigate('/');
      return;
    }
    fetchRoles();
  }, [isBoss, navigate]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.roles);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки ролей',
        description: error.response?.data?.error || 'Не удалось загрузить роли',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedPermissions([]);
    onOpen();
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions);
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, {
          name: roleName,
          permissions: selectedPermissions
        });
        toast({
          title: 'Роль обновлена',
          status: 'success',
          duration: 3000
        });
      } else {
        await api.post('/roles', {
          name: roleName,
          permissions: selectedPermissions
        });
        toast({
          title: 'Роль создана',
          status: 'success',
          duration: 3000
        });
      }
      fetchRoles();
      onClose();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось сохранить роль',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleDelete = async (roleId) => {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) return;

    try {
      await api.delete(`/roles/${roleId}`);
      toast({
        title: 'Роль удалена',
        status: 'success',
        duration: 3000
      });
      fetchRoles();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось удалить роль',
        status: 'error',
        duration: 5000
      });
    }
  };

  const togglePermission = (permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleCategoryPermissions = (group) => {
    const groupPermissions = group.permissions.map(p => p.value);
    const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      // Снять все права категории
      setSelectedPermissions(prev => 
        prev.filter(p => !groupPermissions.includes(p))
      );
    } else {
      // Добавить все права категории
      const uniquePermissions = [...new Set([...selectedPermissions, ...groupPermissions])];
      setSelectedPermissions(uniquePermissions);
    }
  };

  const isCategoryFullySelected = (group) => {
    const groupPermissions = group.permissions.map(p => p.value);
    return groupPermissions.every(p => selectedPermissions.includes(p));
  };

  const isCategoryPartiallySelected = (group) => {
    const groupPermissions = group.permissions.map(p => p.value);
    const hasSelected = groupPermissions.some(p => selectedPermissions.includes(p));
    const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));
    return hasSelected && !allSelected;
  };

  if (!isBoss) return null;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Управление ролями</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleOpenCreate}>
            Создать роль
          </Button>
        </HStack>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Название</Th>
                <Th>Статус</Th>
                <Th>Пользователей</Th>
                <Th>Прав</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {roles.map((role) => (
                <Tr key={role.id}>
                  <Td fontWeight="medium">{role.name}</Td>
                  <Td>
                    {role.isBoss && <Badge colorScheme="purple">Босс</Badge>}
                  </Td>
                  <Td>{role._count?.users || 0}</Td>
                  <Td>{role.permissions.length}</Td>
                  <Td>
                    <HStack spacing={2}>
                      {!role.isBoss && (
                        <>
                          <IconButton
                            icon={<FiEdit2 />}
                            size="sm"
                            onClick={() => handleOpenEdit(role)}
                          />
                          <IconButton
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDelete(role.id)}
                          />
                        </>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingRole ? 'Редактировать роль' : 'Создать роль'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Название роли</FormLabel>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Название роли"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Права доступа</FormLabel>
                <VStack spacing={4} align="stretch">
                  {PERMISSIONS_BY_CATEGORY.map((group, groupIndex) => (
                    <Box key={group.category}>
                      <HStack mb={2}>
                        <Checkbox
                          isChecked={isCategoryFullySelected(group)}
                          isIndeterminate={isCategoryPartiallySelected(group)}
                          onChange={() => toggleCategoryPermissions(group)}
                          colorScheme="blue"
                          fontWeight="bold"
                        >
                          <Text fontWeight="bold" fontSize="md">
                            {group.category}
                          </Text>
                        </Checkbox>
                      </HStack>
                      {group.description && (
                        <Text fontSize="xs" color="gray.500" mb={2} pl={6}>
                          {group.description}
                        </Text>
                      )}
                      <Stack spacing={2} pl={6}>
                        {group.permissions.map((perm) => (
                          <Checkbox
                            key={perm.value}
                            isChecked={selectedPermissions.includes(perm.value)}
                            onChange={() => togglePermission(perm.value)}
                            size="sm"
                          >
                            {perm.label}
                          </Checkbox>
                        ))}
                      </Stack>
                      {groupIndex < PERMISSIONS_BY_CATEGORY.length - 1 && (
                        <Divider mt={3} />
                      )}
                    </Box>
                  ))}
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Отмена
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Сохранить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RolesPage;
