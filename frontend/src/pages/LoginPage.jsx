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

const LoginPage = () => {
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
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
      toast({
        title: 'Вход выполнен',
        description: `Добро пожаловать, ${response.data.user.name}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Ошибка входа',
        description: error.response?.data?.error || 'Неверный email или пароль',
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
              Вход в ToolManager
            </Heading>
            <Text color="gray.600" textAlign="center">
              Войдите в систему для управления инструментами
            </Text>

            <Box as="form" onSubmit={handleSubmit} w="100%">
              <VStack spacing={4}>
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="100%"
                  isLoading={loading}
                >
                  Войти
                </Button>
              </VStack>
            </Box>

            <Text fontSize="sm">
              Нет аккаунта?{' '}
              <Link as={RouterLink} to="/register" color="blue.500" fontWeight="medium">
                Зарегистрироваться
              </Link>
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
};

export default LoginPage;
