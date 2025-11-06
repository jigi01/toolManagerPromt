import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  VStack,
  useToast,
  Box,
  Text,
  FormHelperText
} from '@chakra-ui/react';
import api from '../services/api';
import { compressImage } from '../utils/imageCompression';

const EditToolModal = ({ isOpen, onClose, tool, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    description: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name || '',
        serialNumber: tool.serialNumber || '',
        description: tool.description || '',
        imageUrl: tool.imageUrl || ''
      });
      setImagePreview(tool.imageUrl || '');
    }
  }, [tool]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем тип файла
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Неверный формат',
          description: 'Поддерживаются только изображения (JPG, PNG, GIF, WebP, SVG)',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Проверяем размер файла (макс 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB в байтах
      if (file.size > maxSize) {
        toast({
          title: 'Файл слишком большой',
          description: 'Максимальный размер изображения - 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setImageFile(file);
      
      // Показываем превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      // Сжимаем изображение перед загрузкой
      const compressedDataUrl = await compressImage(file, 1920, 1920, 0.8);
      return compressedDataUrl;
    } catch (error) {
      console.error('Ошибка сжатия изображения:', error);
      // В случае ошибки возвращаем оригинал
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      await api.put(`/tools/${tool.id}`, { ...formData, imageUrl });
      
      toast({
        title: 'Инструмент обновлен',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось обновить инструмент',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Редактировать Инструмент</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Название</FormLabel>
                <Input
                  placeholder="Дрель Makita XF-200"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Серийный номер</FormLabel>
                <Input
                  placeholder="SN-12345"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Описание</FormLabel>
                <Textarea
                  placeholder="Дополнительная информация..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Изображение</FormLabel>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleImageChange}
                  pt={1}
                />
                <FormHelperText>
                  Поддерживаемые форматы: JPG, PNG, GIF, WebP, SVG (макс. 5MB). Или введите URL изображения:
                </FormHelperText>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  mt={2}
                />
              </FormControl>

              {(imagePreview || formData.imageUrl) && (
                <Box w="100%">
                  <Text fontSize="sm" mb={2}>Предпросмотр:</Text>
                  <Box
                    as="img"
                    src={imagePreview || formData.imageUrl}
                    alt="Preview"
                    maxH="200px"
                    objectFit="contain"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                  />
                </Box>
              )}

              <Button 
                type="submit" 
                colorScheme="blue" 
                width="100%"
                isLoading={isSubmitting}
              >
                Сохранить
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EditToolModal;
