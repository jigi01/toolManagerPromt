import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Link,
  Card,
  CardBody
} from '@chakra-ui/react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password });
      setUser(response.data.user);
      
      const isAdmin = response.data.user.role === 'ADMIN';
      
      toast({
        title: 'Регистрация успешна!',
        description: isAdmin 
          ? 'Вы первый пользователь и получили права администратора!' 
          : `Добро пожаловать, ${response.data.user.name}!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Ошибка регистрации',
        description: error.response?.data?.error || 'Не удалось зарегистрироваться',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" py={20}>
      <Card>
        <CardBody>
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center">
              Регистрация в ToolManager
            </Heading>
            <Text color="gray.600" textAlign="center">
              Создайте аккаунт для управления инструментами
            </Text>

            <Box as="form" onSubmit={handleSubmit} w="100%">
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Имя</FormLabel>
                  <Input
                    type="text"
                    placeholder="Иван Иванов"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Пароль</FormLabel>
                  <Input
                    type="password"
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="100%"
                  isLoading={loading}
                >
                  Зарегистрироваться
                </Button>
              </VStack>
            </Box>

            <Text fontSize="sm">
              Уже есть аккаунт?{' '}
              <Link as={RouterLink} to="/login" color="blue.500" fontWeight="medium">
                Войти
              </Link>
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
};

export default RegisterPage;
