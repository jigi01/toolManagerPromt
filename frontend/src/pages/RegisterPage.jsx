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
  AlertDescription,
  Image,
  Divider,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { FaYandex } from 'react-icons/fa';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Logo from '../img/Logo.png';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [verificationCode, setVerificationCode] = useState('');

  const navigate = useNavigate();
  const toast = useToast();
  const setUser = useAuthStore((state) => state.setUser);

  const inviteToken = searchParams.get('invite');

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);

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

  // Bugfix: Logout previous user when visiting register page
  useEffect(() => {
    localStorage.removeItem('token');
    useAuthStore.getState().logout();
  }, []);

  // Save invite token for OAuth flow
  useEffect(() => {
    if (inviteToken) {
      sessionStorage.setItem('pendingInviteToken', inviteToken);
    } else {
      sessionStorage.removeItem('pendingInviteToken');
    }
  }, [inviteToken]);

  // 1. Intercept Browser Back Button
  useEffect(() => {
    if (step === 'verify') {
      // Push state to "trap" the user so Back button just pops this state but stays on page
      window.history.pushState(null, null, window.location.pathname);

      const handlePopState = (event) => {
        // User pressed Back
        event.preventDefault(); // Doesn't really work for popstate but good practice
        setIsExitModalOpen(true);
        setPendingPath('/'); // Default fallback for back button (or just let them go back? usually go to home/login)
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [step]);

  // 2. Intercept Tab Close (Standard Browser Dialog - cannot be replaced)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (step === 'verify') {
        const message = "Вы уверены, что хотите прервать подтверждение? Данные придется вводить заново.";
        e.returnValue = message;
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  // 3. Handle Internal Navigation
  const handleExitClick = (e, path) => {
    if (step === 'verify') {
      e.preventDefault();
      setPendingPath(path);
      setIsExitModalOpen(true);
    } else {
      navigate(path);
    }
  };

  const confirmExit = () => {
    setIsExitModalOpen(false);
    if (pendingPath) {
      navigate(pendingPath);
    } else {
      navigate(-2); // Try to actually go back if it was a back button press? Or just home.
    }
  };

  const cancelExit = () => {
    setIsExitModalOpen(false);
    setPendingPath(null);
    // Restore the "trap" if it was a popstate event
    if (step === 'verify') {
      window.history.pushState(null, null, window.location.pathname);
    }
  };

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

      if (response.data.requiresVerification) {
        setStep('verify');
        // email is already in state
        toast({
          title: 'Проверьте почту',
          description: 'Мы отправили код подтверждения на ' + response.data.email,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      // Old flow (just in case)
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
      navigate('/dashboard');
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

  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if (step === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-email', { email, code: verificationCode });

      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);

      toast({
        title: 'Email подтвержден!',
        description: 'Добро пожаловать в ToolManager',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Ошибка подтверждения',
        description: error.response?.data?.error || 'Неверный код',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-code', { email });
      setResendTimer(30);
      setCanResend(false);
      toast({
        title: 'Код отправлен повторно',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Ошибка отправки',
        description: error.response?.data?.error || 'Не удалось отправить код',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/${provider}`;
  };

  // UI Render
  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" pos="relative">
      {/* ... Logo ... */}
      <Box position="absolute" top={4} left={4} cursor="pointer" onClick={(e) => handleExitClick(e, '/')}>
        <Image src={Logo} alt="ToolManager Logo" h="60px" objectFit="contain" />
      </Box>

      <Container maxW="md">
        {/* ... Card ... */}
        <Card boxShadow="lg" borderRadius="xl">
          <CardBody p={8}>
            <VStack spacing={6}>
              {/* ... Headings ... */}
              {!inviteInfo && (
                <Heading size="lg" textAlign="center">
                  {step === 'verify' ? 'Подтвердите Email' : 'Создать компанию'}
                </Heading>
              )}
              {inviteInfo && (
                <Heading size="lg" textAlign="center">
                  {step === 'verify' ? 'Подтвердите Email' : 'Принять приглашение'}
                </Heading>
              )}

              {/* ... Alerts ... */}
              {inviteInfo && step !== 'verify' && (
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    Вы приглашены в компанию <strong>{inviteInfo.company.name}</strong>
                    {inviteInfo.role && ` с ролью ${inviteInfo.role.name}`}
                  </AlertDescription>
                </Alert>
              )}

              {step === 'verify' && (
                <Alert status="success">
                  <AlertIcon />
                  <AlertDescription>
                    Код подтверждения отправлен на <strong>{email}</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* ... Form ... */}
              <Box as="form" onSubmit={step === 'verify' ? handleVerify : handleSubmit} w="100%">
                <VStack spacing={4}>
                  {step === 'verify' ? (
                    <FormControl isRequired>
                      <FormLabel>Код подтверждения (6 цифр)</FormLabel>
                      <Input
                        type="text"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        textAlign="center"
                        fontSize="2xl"
                        letterSpacing="widest"
                        maxLength={6}
                      />
                    </FormControl>
                  ) : (
                    <>
                      {/* ... Step 1 Fields ... */}
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
                    </>
                  )}

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="100%"
                    isLoading={loading}
                    size="lg"
                  >
                    {step === 'verify' ? 'Подтвердить' : (inviteInfo ? 'Принять приглашение' : 'Создать компанию')}
                  </Button>

                  {step === 'verify' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResendCode}
                      isDisabled={!canResend || loading}
                      width="100%"
                    >
                      {canResend
                        ? 'Отправить код повторно'
                        : `Отправить повторно через ${resendTimer}с`}
                    </Button>
                  )}
                </VStack>
              </Box>

              {/* ... Footer Links ... */}
              {step !== 'verify' && (
                <>
                  <Text fontSize="xs" color="gray.400">
                    {inviteInfo ? 'или войдите через' : 'или зарегистрируйтесь через'}
                  </Text>

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
                </>
              )}

              <Text fontSize="sm">
                {!inviteInfo && (
                  <>
                    Уже есть аккаунт?{' '}
                    <Link
                      as={RouterLink}
                      to="/login"
                      onClick={(e) => {
                        e.preventDefault();
                        handleExitClick(e, '/login');
                      }}
                      color="blue.500"
                      fontWeight="medium"
                      cursor="pointer"
                    >
                      Войти
                    </Link>
                  </>
                )}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Container>

      {/* Confirmation Modal */}
      <Modal isOpen={isExitModalOpen} onClose={cancelExit} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Прервать регистрацию?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Вы уверены, что хотите уйти? Введенные данные будут потеряны, и вам придется начинать регистрацию заново.
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={cancelExit}>
              Остаться
            </Button>
            <Button colorScheme="red" onClick={confirmExit}>
              Прервать
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default RegisterPage;
