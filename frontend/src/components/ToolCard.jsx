import { useState } from 'react';
import {
  Card,
  CardBody,
  Image,
  Stack,
  Heading,
  Text,
  Badge,
  Button,
  HStack,
  IconButton,
  VStack,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box
} from '@chakra-ui/react';
import { FiMoreVertical, FiTrash2, FiSend, FiPackage, FiEye, FiEdit2 } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import TransferModal from './TransferModal';
import CheckinModal from './CheckinModal';
import ToolQRCode from './ToolQRCode';

const ToolCard = ({ tool, onDelete, onTransfer, onCheckin, canUpdate, onEdit, currentUserId }) => {
  const { isOpen: isTransferOpen, onOpen: onTransferOpen, onClose: onTransferClose } = useDisclosure();
  const { isOpen: isCheckinOpen, onOpen: onCheckinOpen, onClose: onCheckinClose } = useDisclosure();
  const [selectedTool, setSelectedTool] = useState(null);

  // Проверяем, может ли текущий пользователь передавать этот инструмент
  const canTransferThisTool = onTransfer && (
    tool.status === 'AVAILABLE' || // Инструмент на складе - может передавать любой с правом TOOL_TRANSFER
    tool.currentUserId === currentUserId // Инструмент у текущего пользователя
  );

  // Проверяем, может ли текущий пользователь вернуть этот инструмент на склад
  const canCheckinThisTool = onCheckin && tool.status === 'IN_USE' && tool.currentUserId === currentUserId;

  const getStatusBadge = (status) => {
    const statusMap = {
      AVAILABLE: { text: 'На складе', color: 'green' },
      IN_USE: { text: 'В использовании', color: 'blue' }
    };
    const { text, color } = statusMap[status] || { text: status, color: 'gray' };
    return <Badge colorScheme={color}>{text}</Badge>;
  };

  const handleTransferClick = () => {
    setSelectedTool(tool);
    onTransferOpen();
  };

  const handleCheckinClick = () => {
    setSelectedTool(tool);
    onCheckinOpen();
  };

  const handleTransferSuccess = (toUserId) => {
    onTransfer(tool.id, toUserId);
    onTransferClose();
  };

  const handleCheckinSuccess = (warehouseId) => {
    onCheckin(tool.id, warehouseId);
    onCheckinClose();
  };

  const placeholderImage = 'https://via.placeholder.com/300x200?text=Инструмент';

  return (
    <>
      <Card 
        overflow="hidden" 
        variant="outline"
        _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
        transition="all 0.2s"
      >
        <Image
          src={tool.imageUrl || placeholderImage}
          alt={tool.name}
          h="200px"
          w="100%"
          objectFit="cover"
          fallbackSrc={placeholderImage}
        />
        <CardBody>
          <Stack spacing={3}>
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={1} flex={1}>
                <Heading size="md" noOfLines={1}>
                  {tool.name}
                </Heading>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                  {tool.serialNumber}
                </Text>
              </VStack>
              {(onDelete || canUpdate || onEdit) && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<FiEye />} as={RouterLink} to={`/tools/${tool.id}`}>
                      Детали
                    </MenuItem>
                    {onEdit && (
                      <MenuItem 
                        icon={<FiEdit2 />} 
                        onClick={() => onEdit(tool)}
                      >
                        Редактировать
                      </MenuItem>
                    )}
                    {onDelete && (
                      <MenuItem 
                        icon={<FiTrash2 />} 
                        onClick={() => onDelete(tool.id)}
                        color="red.500"
                      >
                        Удалить
                      </MenuItem>
                    )}
                  </MenuList>
                </Menu>
              )}
            </HStack>

            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={1} flex={1}>
                <HStack spacing={2}>
                  {getStatusBadge(tool.status)}
                  {tool.category && (
                    <Badge colorScheme="purple" fontSize="xs">
                      {tool.category.name}
                    </Badge>
                  )}
                </HStack>
                
                {tool.price && (
                  <Text fontSize="sm" fontWeight="bold" color="green.600">
                    {parseFloat(tool.price).toFixed(2)} ₽
                  </Text>
                )}
                
                {tool.currentUser ? (
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Владелец:
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {tool.currentUser.name}
                    </Text>
                  </Box>
                ) : (
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Склад:
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {tool.warehouse?.name || 'Не указан'}
                    </Text>
                  </Box>
                )}
              </VStack>
              
              <Box>
                <ToolQRCode tool={tool} size={80} showExpandButton={true} />
              </Box>
            </HStack>

            {tool.description && (
              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                {tool.description}
              </Text>
            )}

            <HStack spacing={2} pt={2}>
              <Button
                as={RouterLink}
                to={`/tools/${tool.id}`}
                size="sm"
                variant="outline"
                flex={1}
              >
                Детали
              </Button>
              
              {canTransferThisTool && (
                <Button
                  size="sm"
                  leftIcon={<FiSend />}
                  colorScheme="blue"
                  onClick={handleTransferClick}
                  flex={1}
                >
                  {tool.status === 'AVAILABLE' ? 'Выдать' : 'Передать'}
                </Button>
              )}
              
              {canCheckinThisTool && (
                <Button
                  size="sm"
                  leftIcon={<FiPackage />}
                  colorScheme="green"
                  onClick={handleCheckinClick}
                  flex={1}
                >
                  На склад
                </Button>
              )}
            </HStack>
          </Stack>
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

export default ToolCard;
