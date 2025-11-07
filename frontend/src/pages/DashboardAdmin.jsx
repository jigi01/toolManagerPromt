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
  Center,
  HStack,
  Badge,
  Divider,
  CardHeader
} from '@chakra-ui/react';
import { FiTool, FiUsers, FiPackage, FiAlertCircle, FiDollarSign, FiActivity } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import api from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    totalValue: 0,
    inUseTools: 0,
    availableTools: 0,
    totalStaff: 0,
    toolsByCategory: []
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchStats();
    fetchActivityFeed();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats/company');
      setStats(response.data);
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

  const fetchActivityFeed = async () => {
    try {
      const response = await api.get('/stats/activity?limit=10');
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Ошибка загрузки активности:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'только что';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} мин. назад`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ч. назад`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      if (days === 1) return 'вчера';
      if (days < 7) return `${days} дн. назад`;
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  const totalTools = stats.inUseTools + stats.availableTools;
  const utilizationRate = totalTools > 0 ? ((stats.inUseTools / totalTools) * 100).toFixed(0) : 0;

  const pieData = stats.toolsByCategory.map(item => ({
    name: item.categoryName,
    value: item.count
  }));

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

      <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center" gap={2}>
                <FiDollarSign /> Общая Стоимость
              </StatLabel>
              <StatNumber fontSize="2xl">{formatCurrency(stats.totalValue)}</StatNumber>
              <StatHelpText>В оборудовании</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center" gap={2}>
                <FiAlertCircle /> В Работе
              </StatLabel>
              <StatNumber color="blue.500">{stats.inUseTools}</StatNumber>
              <StatHelpText>
                {utilizationRate}% использования
              </StatHelpText>
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
                <FiTool /> Всего Инструментов
              </StatLabel>
              <StatNumber>{totalTools}</StatNumber>
              <StatHelpText>В системе</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center" gap={2}>
                <FiUsers /> Сотрудников
              </StatLabel>
              <StatNumber>{stats.totalStaff}</StatNumber>
              <StatHelpText>Зарегистрировано</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Распределение по категориям</Heading>
          </CardHeader>
          <CardBody>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Center h="300px">
                <Text color="gray.500">Нет данных для отображения</Text>
              </Center>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md" display="flex" alignItems="center" gap={2}>
                <FiActivity /> Лента Активности
              </Heading>
              <Badge colorScheme="blue">Последние 10</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            {activities.length > 0 ? (
              <VStack align="stretch" spacing={4} maxH="400px" overflowY="auto">
                {activities.map((activity, index) => (
                  <Box key={activity.id}>
                    <VStack align="stretch" spacing={1}>
                      <Text fontSize="sm" fontWeight="medium">
                        {activity.description}
                      </Text>
                      <HStack spacing={2}>
                        <Text fontSize="xs" color="gray.500">
                          {formatDate(activity.timestamp)}
                        </Text>
                        <Badge
                          colorScheme={activity.action === 'TRANSFER' ? 'blue' : 'green'}
                          fontSize="xs"
                        >
                          {activity.action === 'TRANSFER' ? 'Передача' : 'Возврат'}
                        </Badge>
                      </HStack>
                    </VStack>
                    {index < activities.length - 1 && <Divider mt={4} />}
                  </Box>
                ))}
              </VStack>
            ) : (
              <Center h="200px">
                <Text color="gray.500">Пока нет активности</Text>
              </Center>
            )}
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
