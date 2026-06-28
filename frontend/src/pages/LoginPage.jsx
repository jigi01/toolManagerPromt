import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
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
  CardBody,
  Image,
  Divider,
  HStack,
  Icon,
  IconButton
} from '@chakra-ui/react';
import { FaYandex } from 'react-icons/fa';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Logo from '../img/Logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const setUser = useAuthStore((state) => state.setUser);

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      // Fetch user data with the token
      localStorage.setItem('token', token); // Store token temporarily to make request
      api.get('/auth/me')
        .then((response) => {
          setUser(response.data);
          toast({
            title: 'Вход выполнен',
            description: `Добро пожаловать, ${response.data.name}!`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error(err);
          toast({ title: 'Ошибка', description: 'Не удалось получить данные пользователя', status: 'error' });
        });
    } else if (error) {
      toast({
        title: 'Ошибка входа через соцсеть',
        description: decodeURIComponent(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [searchParams, setUser, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      toast({
        title: 'Вход выполнен',
        description: `Добро пожаловать, ${response.data.user.name}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Ошибка входа',
        description: error.response?.data?.error || (error.message === 'Network Error' ? 'Сервер недоступен' : 'Неверный email или пароль'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/${provider}`;
  };

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" pos="relative">
      {/* Логотип слева сверху */}
      <Box position="absolute" top={4} left={4} cursor="pointer" onClick={() => navigate('/')}>
        <Image src={Logo} alt="ToolManager Logo" h="60px" objectFit="contain" />
      </Box>

      <Container maxW="md">
        <Card boxShadow="lg" borderRadius="xl">
          <CardBody p={8}>
            <VStack spacing={6}>
              <Heading size="lg" textAlign="center">
                Вход в ToolManager
              </Heading>



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
                    size="lg"
                  >
                    Войти
                  </Button>
                </VStack>
              </Box>

              <Text fontSize="xs" color="gray.400">или войдите через</Text>

              <IconButton
                isRound
                size="md"
                colorScheme="red"
                variant="solid"
                icon={<Icon as={FaYandex} boxSize={5} color="white" />}
                onClick={() => handleOAuthLogin('yandex')}
                aria-label="Войти через Яндекс"
                _hover={{ bg: 'red.600' }}
              />

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
    </Box>
  );
};

export default LoginPage;
