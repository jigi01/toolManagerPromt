import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Text,
  Button,
  HStack,
  useToast
} from '@chakra-ui/react';
import { FiMaximize2, FiDownload } from 'react-icons/fi';

const ToolQRCode = ({ tool, size = 100, showLabel = false, showExpandButton = true }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const getToolUrl = () => {
    const origin = window.location.origin;
    return `${origin}/tools/${tool.id}`;
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-modal-${tool.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-${tool.serialNumber || tool.id}.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: 'QR-код скачан',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <>
      <Box position="relative" display="inline-block">
        <QRCodeSVG
          value={getToolUrl()}
          size={size}
          level="M"
          includeMargin={true}
          style={{ cursor: showExpandButton ? 'pointer' : 'default' }}
          onClick={showExpandButton ? onOpen : undefined}
        />
        {showExpandButton && (
          <IconButton
            icon={<FiMaximize2 />}
            size="xs"
            position="absolute"
            bottom={1}
            right={1}
            onClick={onOpen}
            aria-label="Увеличить QR-код"
            colorScheme="blue"
            opacity={0.8}
            _hover={{ opacity: 1 }}
          />
        )}
        {showLabel && (
          <Text fontSize="xs" textAlign="center" mt={1} color="gray.600">
            QR-код
          </Text>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>QR-код инструмента</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Box p={4} bg="white" borderRadius="md">
                <QRCodeSVG
                  id={`qr-modal-${tool.id}`}
                  value={getToolUrl()}
                  size={300}
                  level="H"
                  includeMargin={true}
                />
              </Box>
              
              <VStack spacing={2} align="stretch" w="100%">
                <Text fontSize="sm" fontWeight="bold">
                  {tool.name}
                </Text>
                <Text fontSize="xs" color="gray.600" fontFamily="mono">
                  SN: {tool.serialNumber}
                </Text>
                <Text fontSize="xs" color="gray.500" wordBreak="break-all">
                  {getToolUrl()}
                </Text>
              </VStack>

              <HStack spacing={3} w="100%">
                <Button
                  leftIcon={<FiDownload />}
                  colorScheme="blue"
                  onClick={handleDownload}
                  flex={1}
                >
                  Скачать
                </Button>
                <Button onClick={onClose} flex={1}>
                  Закрыть
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ToolQRCode;
