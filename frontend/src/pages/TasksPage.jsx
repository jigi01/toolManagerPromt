import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  useDisclosure,
  HStack,
  Select,
  useToast,
  Spinner,
  Center,
  VStack,
  Card,
  CardBody,
  Stack,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
} from '@chakra-ui/react';
import { FiPlus, FiCheckCircle, FiPlay, FiXCircle } from 'react-icons/fi';
import useTaskStore from '../store/taskStore';
import useAuthStore from '../store/authStore';
import CreateTaskModal from '../components/CreateTaskModal';

const getStatusBadge = (status) => {
  switch (status) {
    case 'PENDING':
      return <Badge colorScheme="purple">Назначено</Badge>;
    case 'IN_PROGRESS':
      return <Badge colorScheme="blue">В работе</Badge>;
    case 'COMPLETED':
      return <Badge colorScheme="green">Выполнено</Badge>;
    case 'CANCELLED':
      return <Badge colorScheme="red">Отменено</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const TasksPage = () => {
  const { tasks, isLoading, error, fetchTasks, updateTaskStatus } = useTaskStore();
  const { isBoss, user } = useAuthStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const toast = useToast();
  
  const [filterStatus, setFilterStatus] = useState('');
  const [taskToCancel, setTaskToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchTasks(filterStatus ? { status: filterStatus } : {});
  }, [fetchTasks, filterStatus]);

  const handleStatusChange = async (taskId, newStatus) => {
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      toast({
        title: 'Статус обновлен',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason || cancelReason.trim().length < 5) {
      toast({
        title: 'Ошибка',
        description: 'Причина отмены должна содержать минимум 5 символов',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsCancelling(true);
    const success = await updateTaskStatus(taskToCancel, 'CANCELLED', cancelReason);
    setIsCancelling(false);
    
    if (success) {
      toast({
        title: 'Задача отменена',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onCancelClose();
      setCancelReason('');
      setTaskToCancel(null);
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <Center h="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Задачи</Heading>
        {isBoss && (
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
            Создать задачу
          </Button>
        )}
      </Flex>

      <Flex mb={6}>
        <Select 
          placeholder="Все статусы" 
          w="200px" 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="PENDING">Назначено</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="COMPLETED">Выполнено</option>
          <option value="CANCELLED">Отменено</option>
        </Select>
      </Flex>

      {error && (
        <Text color="red.500" mb={4}>{error}</Text>
      )}

      <Stack spacing={4}>
        {tasks.map((task) => (
          <Card key={task.id} variant="outline" shadow="sm">
            <CardBody>
              <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
                <Box flex="1">
                  <HStack mb={2}>
                    <Heading size="md">{task.title}</Heading>
                    {getStatusBadge(task.status)}
                  </HStack>
                  <Text color="gray.600" mb={3}>{task.description || 'Нет описания'}</Text>
                  
                  <Divider mb={3} />
                  
                  <VStack align="flex-start" spacing={1} fontSize="sm">
                    <Text><b>Исполнитель:</b> {task.assignee?.name || 'Не указан'}</Text>
                    <Text><b>Адрес:</b> {task.address}</Text>
                    <Text><b>Срок сдачи:</b> {new Date(task.dueDate).toLocaleString()}</Text>
                    {task.requiredCategories?.length > 0 && (
                      <Text>
                        <b>Необходимые инструменты:</b>{' '}
                        {task.requiredCategories.map(c => c.name).join(', ')}
                      </Text>
                    )}
                    {task.status === 'CANCELLED' && task.cancellationReason && (
                      <Text color="red.600" mt={2}>
                        <b>Причина отмены:</b> {task.cancellationReason}
                      </Text>
                    )}
                  </VStack>
                </Box>
                
                <Box>
                  <VStack align="stretch" minW="150px">
                    {(isBoss || user.id === task.assigneeId) && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                      <>
                        {task.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            colorScheme="blue" 
                            leftIcon={<FiPlay />}
                            onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                          >
                            Взять в работу
                          </Button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <Button 
                            size="sm" 
                            colorScheme="green" 
                            leftIcon={<FiCheckCircle />}
                            onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                          >
                            Завершить
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          colorScheme="red" 
                          variant="outline"
                          leftIcon={<FiXCircle />}
                          onClick={() => {
                            setTaskToCancel(task.id);
                            setCancelReason('');
                            onCancelOpen();
                          }}
                        >
                          Отменить
                        </Button>
                      </>
                    )}
                  </VStack>
                </Box>
              </Flex>
            </CardBody>
          </Card>
        ))}
        {tasks.length === 0 && !isLoading && (
          <Text color="gray.500" textAlign="center" py={10}>
            Задачи не найдены
          </Text>
        )}
      </Stack>

      {isOpen && (
        <CreateTaskModal isOpen={isOpen} onClose={onClose} />
      )}

      {/* Модальное окно отмены задачи */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Отмена задачи</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Причина отмены</FormLabel>
              <Textarea 
                placeholder="Укажите, почему задача отменяется (минимум 5 символов)..." 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                autoFocus
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCancelClose} isDisabled={isCancelling}>
              Назад
            </Button>
            <Button colorScheme="red" onClick={handleConfirmCancel} isLoading={isCancelling}>
              Подтвердить отмену
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TasksPage;
