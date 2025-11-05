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

const ToolTable = ({ tools, onDelete, onTransfer, onCheckin, canUpdate, onEdit }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
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
    onOpen();
  };

  const handleTransferSuccess = (toUserId) => {
    onTransfer(selectedTool.id, toUserId);
    onClose();
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
                <Th>Статус</Th>
                <Th>Владелец</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tools.map((tool) => (
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
                  <Td>{getStatusBadge(tool.status)}</Td>
                  <Td>
                    {tool.currentUser ? (
                      <Text>{tool.currentUser.name}</Text>
                    ) : (
                      <Text color="gray.500">—</Text>
                    )}
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
                      
                      {tool.status === 'AVAILABLE' && onTransfer && (
                        <Button
                          size="sm"
                          leftIcon={<FiSend />}
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => handleTransferClick(tool)}
                        >
                          Выдать
                        </Button>
                      )}
                      
                      {tool.status === 'IN_USE' && onCheckin && (
                        <Button
                          size="sm"
                          leftIcon={<FiPackage />}
                          colorScheme="green"
                          variant="outline"
                          onClick={() => onCheckin(tool.id)}
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
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {selectedTool && (
        <TransferModal
          isOpen={isOpen}
          onClose={onClose}
          tool={selectedTool}
          onSuccess={handleTransferSuccess}
        />
      )}
    </>
  );
};

export default ToolTable;
