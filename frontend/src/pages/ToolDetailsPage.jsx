import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  Button,
  useToast,
  Spinner,
  Center,
  Card,
  CardBody,
  HStack,
  Text,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar
} from '@chakra-ui/react';
import { FiArrowLeft, FiClock } from 'react-icons/fi';
import api from '../services/api';

const ToolDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchToolDetails();
  }, [id]);

  const fetchToolDetails = async () => {
    try {
      const response = await api.get(`/tools/${id}`);
      setTool(response.data.tool);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить детали инструмента',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      AVAILABLE: { text: 'На складе', color: 'green' },
      IN_USE: { text: 'В использовании', color: 'blue' },
      MAINTENANCE: { text: 'На обслуживании', color: 'orange' }
    };
    const { text, color } = statusMap[status] || { text: status, color: 'gray' };
    return <Badge colorScheme={color}>{text}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!tool) return null;

  return (
    <VStack spacing={8} align="stretch">
      <HStack justify="space-between">
        <Button leftIcon={<FiArrowLeft />} variant="ghost" onClick={() => navigate(-1)}>
          Назад
        </Button>
      </HStack>

      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="lg" mb={2}>
                {tool.name}
              </Heading>
              <HStack spacing={4} mt={2}>
                {getStatusBadge(tool.status)}
                <Text color="gray.500" fontFamily="mono" fontSize="sm">
                  {tool.serialNumber}
                </Text>
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold" mb={2}>
                Информация
              </Text>
              <VStack align="stretch" spacing={2}>
                <HStack>
                  <Text color="gray.600" minW="150px">
                    Текущий владелец:
                  </Text>
                  <Text fontWeight="medium">
                    {tool.currentOwner ? tool.currentOwner.name : 'На складе'}
                  </Text>
                </HStack>
                {tool.description && (
                  <HStack align="start">
                    <Text color="gray.600" minW="150px">
                      Описание:
                    </Text>
                    <Text>{tool.description}</Text>
                  </HStack>
                )}
                <HStack>
                  <Text color="gray.600" minW="150px">
                    Дата создания:
                  </Text>
                  <Text>{formatDate(tool.createdAt)}</Text>
                </HStack>
              </VStack>
            </Box>

            <Divider />

            <Box>
              <HStack mb={4}>
                <FiClock />
                <Text fontWeight="bold">История перемещений</Text>
              </HStack>

              {tool.history && tool.history.length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Дата</Th>
                      <Th>От кого</Th>
                      <Th>Кому</Th>
                      <Th>Примечание</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tool.history.map((record) => (
                      <Tr key={record.id}>
                        <Td>{formatDate(record.timestamp)}</Td>
                        <Td>
                          {record.fromUser ? (
                            <HStack>
                              <Avatar size="xs" name={record.fromUser.name} />
                              <Text>{record.fromUser.name}</Text>
                            </HStack>
                          ) : (
                            <Text color="gray.500">Склад</Text>
                          )}
                        </Td>
                        <Td>
                          {record.toUser ? (
                            <HStack>
                              <Avatar size="xs" name={record.toUser.name} />
                              <Text>{record.toUser.name}</Text>
                            </HStack>
                          ) : (
                            <Text color="gray.500">Склад</Text>
                          )}
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.600">
                            {record.notes || '—'}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500">История перемещений пока пуста</Text>
              )}
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default ToolDetailsPage;
