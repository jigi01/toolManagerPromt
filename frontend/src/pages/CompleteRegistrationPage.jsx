import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    Card,
    CardBody,
    Image
} from '@chakra-ui/react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Logo from '../img/Logo.png';

const CompleteRegistrationPage = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [inviteToken, setInviteToken] = useState(null);
    const [email, setEmail] = useState('');
    const [isEmailEditable, setIsEmailEditable] = useState(false);

    const navigate = useNavigate();
    const toast = useToast();
    const setUser = useAuthStore((state) => state.setUser);

    const token = searchParams.get('token');

    useEffect(() => {
        const storedInviteToken = sessionStorage.getItem('pendingInviteToken');
        if (storedInviteToken) {
            setInviteToken(storedInviteToken);
        }

        if (token) {
            try {
                const decoded = jwtDecode(token);
                setProfile(decoded);

                // If email is a placeholder, allow editing
                if (decoded.email && decoded.email.includes('placeholder.com')) {
                    setEmail(''); // Start empty so they type a real one
                    setIsEmailEditable(true);
                } else {
                    setEmail(decoded.email);
                    setIsEmailEditable(false);
                }
            } catch (error) {
                toast({
                    title: 'Ошибка',
                    description: 'Некорректный токен регистрации',
                    status: 'error',
                    duration: 5000,
                });
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [token, navigate, toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({ title: 'Ошибка', description: 'Пароли не совпадают', status: 'error' });
            return;
        }

        if (password.length < 6) {
            toast({ title: 'Ошибка', description: 'Минимум 6 символов в пароле', status: 'error' });
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/oauth/register', {
                token,
                password,
                companyName: inviteToken ? null : companyName,
                inviteToken,
                email: isEmailEditable ? email : undefined // Send emai only if edited
            });

            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);

            toast({
                title: 'Регистрация завершена',
                description: `Добро пожаловать, ${response.data.user.name}!`,
                status: 'success',
                duration: 3000,
            });
            navigate('/dashboard');
        } catch (error) {
            toast({
                title: 'Ошибка регистрации',
                description: error.response?.data?.error || 'Произошла ошибка',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return null;

    return (
        <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" pos="relative">
            <Box position="absolute" top={4} left={4} cursor="pointer" onClick={() => navigate('/')}>
                <Image src={Logo} alt="ToolManager Logo" h="60px" objectFit="contain" />
            </Box>

            <Container maxW="md">
                <Card boxShadow="lg" borderRadius="xl">
                    <CardBody p={8}>
                        <VStack spacing={6}>
                            <Heading size="lg" textAlign="center">
                                Завершение регистрации
                            </Heading>

                            <Text textAlign="center" color="gray.600">
                                Привет, <strong>{profile.name}</strong>! <br />
                                {inviteToken
                                    ? 'Для завершения регистрации и вступления в компанию задайте пароль.'
                                    : 'Для завершения регистрации создайте свою компанию и задайте пароль.'
                                }
                            </Text>

                            <Box as="form" onSubmit={handleSubmit} w="100%">
                                <VStack spacing={4}>
                                    {isEmailEditable && (
                                        <FormControl isRequired>
                                            <FormLabel>Ваш Email</FormLabel>
                                            <Input
                                                type="email"
                                                placeholder="my.email@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                            <Text fontSize="xs" color="gray.500" mt={1}>
                                                Мы не получили email от провайдера, пожалуйста, укажите его вручную.
                                            </Text>
                                        </FormControl>
                                    )}

                                    {!inviteToken && (
                                        <FormControl isRequired>
                                            <FormLabel>Название компании</FormLabel>
                                            <Input
                                                placeholder="Моя Компания"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                            />
                                        </FormControl>
                                    )}

                                    <FormControl isRequired>
                                        <FormLabel>Придумайте пароль</FormLabel>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </FormControl>

                                    <FormControl isRequired>
                                        <FormLabel>Повторите пароль</FormLabel>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </FormControl>

                                    <Button
                                        type="submit"
                                        colorScheme="blue"
                                        width="100%"
                                        isLoading={loading}
                                        size="lg"
                                        mt={4}
                                    >
                                        Завершить регистрацию
                                    </Button>
                                </VStack>
                            </Box>
                        </VStack>
                    </CardBody>
                </Card>
            </Container>
        </Box>
    );
};

export default CompleteRegistrationPage;
