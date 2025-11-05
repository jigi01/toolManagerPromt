import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Text,
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
  Button,
  Card,
  CardBody,
  HStack,
  useDisclosure
} from '@chakra-ui/react';
import { FiPackage, FiSend } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import TransferToolModal from '../components/TransferToolModal';

const DashboardEmployee = () => {
  const [myTools, setMyTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchMyTools();
  }, [user]);

  const fetchMyTools = async () => {
    try {
      const response = await api.get(`/tools?currentUserId=${user.id}`);
      setMyTools(response.data.tools);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить ваши инструменты',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferClick = (tool) => {
    setSelectedTool(tool);
    onOpen();
  };

  const handleTransferSuccess = () => {
    fetchMyTools();
    onClose();
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
          Мои Инструменты
        </Heading>
        <Text color="gray.600">
          Инструменты, которые числятся за вами
        </Text>
      </Box>

      {myTools.length === 0 ? (
        <Card>
          <CardBody>
            <Center py={10}>
              <VStack spacing={4}>
                <FiPackage size={48} color="gray" />
                <Text color="gray.500" fontSize="lg">
                  У вас пока нет инструментов
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Инструменты появятся здесь, когда администратор выдаст их вам
                </Text>
              </VStack>
            </Center>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Название</Th>
                  <Th>Серийный номер</Th>
                  <Th>Статус</Th>
                  <Th>Действия</Th>
                </Tr>
              </Thead>
              <Tbody>
                {myTools.map((tool) => (
                  <Tr key={tool.id}>
                    <Td fontWeight="medium">{tool.name}</Td>
                    <Td>
                      <Text fontFamily="mono" fontSize="sm">
                        {tool.serialNumber}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">В использовании</Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          as={RouterLink}
                          to={`/tools/${tool.id}`}
                          size="sm"
                          variant="outline"
                        >
                          Детали
                        </Button>
                        <Button
                          size="sm"
                          leftIcon={<FiSend />}
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => handleTransferClick(tool)}
                        >
                          Передать
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {selectedTool && (
        <TransferToolModal
          isOpen={isOpen}
          onClose={onClose}
          tool={selectedTool}
          onSuccess={handleTransferSuccess}
        />
      )}
    </VStack>
  );
};

export default DashboardEmployee;
