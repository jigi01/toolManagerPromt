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
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  const navigate = useNavigate();
  const toast = useToast();
  const setUser = useAuthStore((state) => state.setUser);

  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    const fetchInviteInfo = async () => {
      if (inviteToken) {
        setInviteLoading(true);
        try {
          const response = await api.get(`/invitations/public/${inviteToken}`);
          setInviteInfo(response.data.invitation);
          setEmail(response.data.invitation.email);
        } catch (error) {
          toast({
            title: 'Ошибка приглашения',
            description: error.response?.data?.error || 'Неверная ссылка приглашения',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setInviteLoading(false);
        }
      }
    };

    fetchInviteInfo();
  }, [inviteToken, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { name, email, password };
      
      if (inviteToken) {
        payload.inviteToken = inviteToken;
      } else {
        if (!companyName) {
          toast({
            title: 'Ошибка',
            description: 'Необходимо указать название компании',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }
        payload.companyName = companyName;
      }

      const response = await api.post('/auth/register', payload);
      setUser(response.data.user);
      
      const isBoss = response.data.user.role?.isBoss;
      
      toast({
        title: 'Регистрация успешна!',
        description: isBoss 
          ? 'Компания создана! Вы получили права Босса!' 
          : `Добро пожаловать в ${inviteInfo?.company?.name || 'компанию'}, ${response.data.user.name}!`,
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

  if (inviteLoading) {
    return (
      <Container maxW="md" py={20}>
        <Card>
          <CardBody>
            <Text textAlign="center">Загрузка информации о приглашении...</Text>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxW="md" py={20}>
      <Card>
        <CardBody>
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center">
              {inviteInfo ? 'Принять приглашение' : 'Создать новую компанию'}
            </Heading>
            
            {inviteInfo && (
              <Alert status="info">
                <AlertIcon />
                <AlertDescription>
                  Вы приглашены в компанию <strong>{inviteInfo.company.name}</strong>
                  {inviteInfo.role && ` с ролью ${inviteInfo.role.name}`}
                </AlertDescription>
              </Alert>
            )}

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
                    isReadOnly={!!inviteInfo}
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

                {!inviteInfo && (
                  <FormControl isRequired>
                    <FormLabel>Название компании</FormLabel>
                    <Input
                      type="text"
                      placeholder="Моя Компания"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </FormControl>
                )}

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="100%"
                  isLoading={loading}
                >
                  {inviteInfo ? 'Принять приглашение' : 'Создать компанию'}
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
