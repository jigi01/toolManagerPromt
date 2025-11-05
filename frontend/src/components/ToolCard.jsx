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
import { FiMoreVertical, FiTrash2, FiSend, FiPackage, FiEye } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import TransferModal from './TransferModal';

const ToolCard = ({ tool, onDelete, onTransfer, onCheckin, canUpdate }) => {
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

  const handleTransferClick = () => {
    setSelectedTool(tool);
    onOpen();
  };

  const handleTransferSuccess = (toUserId) => {
    onTransfer(tool.id, toUserId);
    onClose();
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
              {(onDelete || canUpdate) && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    {canUpdate && (
                      <MenuItem icon={<FiEye />} as={RouterLink} to={`/tools/${tool.id}`}>
                        Детали
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

            {getStatusBadge(tool.status)}

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
              <Text fontSize="sm" color="gray.500">
                Доступен на складе
              </Text>
            )}

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
              
              {tool.status === 'AVAILABLE' && onTransfer && (
                <Button
                  size="sm"
                  leftIcon={<FiSend />}
                  colorScheme="blue"
                  onClick={handleTransferClick}
                  flex={1}
                >
                  Выдать
                </Button>
              )}
              
              {tool.status === 'IN_USE' && onCheckin && (
                <Button
                  size="sm"
                  leftIcon={<FiPackage />}
                  colorScheme="green"
                  onClick={() => onCheckin(tool.id)}
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

export default ToolCard;
