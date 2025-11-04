import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  useToast,
  VStack,
  Text,
  Spinner,
  Center
} from '@chakra-ui/react';
import { FiTool, FiUsers, FiPackage, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    totalTools: 0,
    availableTools: 0,
    inUseTools: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [toolsResponse, usersResponse] = await Promise.all([
        api.get('/tools'),
        api.get('/users')
      ]);

      const tools = toolsResponse.data.tools;
      const users = usersResponse.data.users;

      setStats({
        totalTools: tools.length,
        availableTools: tools.filter(t => t.status === 'AVAILABLE').length,
        inUseTools: tools.filter(t => t.status === 'IN_USE').length,
        totalUsers: users.length
      });
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить статистику',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
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
          Панель Администратора
        </Heading>
        <Text color="gray.600">
          Общая статистика системы ToolManager
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center" gap={2}>
                <FiTool /> Всего Инструментов
              </StatLabel>
              <StatNumber>{stats.totalTools}</StatNumber>
              <StatHelpText>В системе</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center" gap={2}>
                <FiPackage /> На складе
              </StatLabel>
              <StatNumber color="green.500">{stats.availableTools}</StatNumber>
              <StatHelpText>Доступно</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center" gap={2}>
                <FiAlertCircle /> В использовании
              </StatLabel>
              <StatNumber color="blue.500">{stats.inUseTools}</StatNumber>
              <StatHelpText>У сотрудников</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center" gap={2}>
                <FiUsers /> Сотрудников
              </StatLabel>
              <StatNumber>{stats.totalUsers}</StatNumber>
              <StatHelpText>Зарегистрировано</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card>
        <CardBody>
          <Heading size="md" mb={4}>
            Быстрые действия
          </Heading>
          <Text color="gray.600">
            Используйте меню навигации для управления инструментами и сотрудниками.
          </Text>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default DashboardAdmin;
