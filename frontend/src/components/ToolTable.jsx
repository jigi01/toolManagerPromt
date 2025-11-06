import { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardBody,
  HStack,
  Button,
  IconButton,
  Text,
  Image,
  useDisclosure,
  Avatar
} from '@chakra-ui/react';
import { FiSend, FiPackage, FiTrash2, FiEye, FiEdit2 } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import TransferModal from './TransferModal';
import CheckinModal from './CheckinModal';
import ToolQRCode from './ToolQRCode';

const ToolTable = ({ tools, onDelete, onTransfer, onCheckin, canUpdate, onEdit, currentUserId }) => {
  const { isOpen: isTransferOpen, onOpen: onTransferOpen, onClose: onTransferClose } = useDisclosure();
  const { isOpen: isCheckinOpen, onOpen: onCheckinOpen, onClose: onCheckinClose } = useDisclosure();
  const [selectedTool, setSelectedTool] = useState(null);

  const getStatusBadge = (status) => {
    const statusMap = {
      AVAILABLE: { text: 'На складе', color: 'green' },
      IN_USE: { text: 'В использовании', color: 'blue' }
    };
    const { text, color } = statusMap[status] || { text: status, color: 'gray' };
    return <Badge colorScheme={color}>{text}</Badge>;
  };

  const handleTransferClick = (tool) => {
    setSelectedTool(tool);
    onTransferOpen();
  };

  const handleCheckinClick = (tool) => {
    setSelectedTool(tool);
    onCheckinOpen();
  };

  const handleTransferSuccess = (toUserId) => {
    onTransfer(selectedTool.id, toUserId);
    onTransferClose();
  };

  const handleCheckinSuccess = (warehouseId) => {
    onCheckin(selectedTool.id, warehouseId);
    onCheckinClose();
  };

  return (
    <>
      <Card>
        <CardBody overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Инструмент</Th>
                <Th>Серийный номер</Th>
                <Th>Категория</Th>
                <Th>Цена</Th>
                <Th>Статус</Th>
                <Th>Владелец</Th>
                <Th>QR-код</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tools.map((tool) => {
                // Проверяем, может ли текущий пользователь передавать этот инструмент
                const canTransferThisTool = onTransfer && (
                  tool.status === 'AVAILABLE' || 
                  tool.currentUserId === currentUserId
                );

                // Проверяем, может ли текущий пользователь вернуть этот инструмент на склад
                const canCheckinThisTool = onCheckin && tool.status === 'IN_USE' && tool.currentUserId === currentUserId;

                return (
                  <Tr key={tool.id}>
                    <Td>
                      <HStack spacing={3}>
                        {tool.imageUrl ? (
                          <Image
                            src={tool.imageUrl}
                            alt={tool.name}
                            boxSize="40px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                        ) : (
                          <Avatar name={tool.name} size="sm" />
                        )}
                        <Text fontWeight="medium">{tool.name}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontFamily="mono" fontSize="sm">
                        {tool.serialNumber}
                      </Text>
                    </Td>
                    <Td>
                      {tool.category ? (
                        <Badge colorScheme="purple" fontSize="xs">
                          {tool.category.name}
                        </Badge>
                      ) : (
                        <Text color="gray.500" fontSize="sm">—</Text>
                      )}
                    </Td>
                    <Td>
                      {tool.price ? (
                        <Text fontWeight="medium" color="green.600">
                          {parseFloat(tool.price).toFixed(2)} ₽
                        </Text>
                      ) : (
                        <Text color="gray.500" fontSize="sm">—</Text>
                      )}
                    </Td>
                    <Td>{getStatusBadge(tool.status)}</Td>
                    <Td>
                      {tool.currentUser ? (
                        <Text>{tool.currentUser.name}</Text>
                      ) : (
                        <Text color="gray.500">—</Text>
                      )}
                    </Td>
                    <Td>
                      <ToolQRCode tool={tool} size={50} showExpandButton={true} />
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          as={RouterLink}
                          to={`/tools/${tool.id}`}
                          size="sm"
                          variant="outline"
                          leftIcon={<FiEye />}
                        >
                          Детали
                        </Button>
                        
                        {onEdit && (
                          <IconButton
                            icon={<FiEdit2 />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => onEdit(tool)}
                            aria-label="Редактировать"
                          />
                        )}
                        
                        {canTransferThisTool && (
                          <Button
                            size="sm"
                            leftIcon={<FiSend />}
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => handleTransferClick(tool)}
                          >
                            {tool.status === 'AVAILABLE' ? 'Выдать' : 'Передать'}
                          </Button>
                        )}
                        
                        {canCheckinThisTool && (
                          <Button
                            size="sm"
                            leftIcon={<FiPackage />}
                            colorScheme="green"
                            variant="outline"
                            onClick={() => handleCheckinClick(tool)}
                          >
                            На склад
                          </Button>
                        )}
                        
                        {onDelete && (
                          <IconButton
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => onDelete(tool.id)}
                          />
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {selectedTool && (
        <>
          <TransferModal
            isOpen={isTransferOpen}
            onClose={onTransferClose}
            tool={selectedTool}
            onSuccess={handleTransferSuccess}
          />
          <CheckinModal
            isOpen={isCheckinOpen}
            onClose={onCheckinClose}
            tool={selectedTool}
            onSuccess={handleCheckinSuccess}
          />
        </>
      )}
    </>
  );
};

export default ToolTable;
