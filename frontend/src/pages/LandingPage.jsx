import { useState, useEffect } from 'react';
import {
    Box, Button, Container, Heading, Text, VStack, SimpleGrid, Icon, Flex, Image,
    HStack, Badge, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    useDisclosure, Input, Divider, Grid, GridItem, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FaTools, FaWarehouse, FaChartLine, FaUsers, FaHistory, FaCheckCircle, FaMobileAlt,
    FaQrcode, FaFileImport, FaBell, FaFileInvoice, FaShapes, FaHeadset, FaUserTie,
    FaBuilding, FaHardHat, FaHotel, FaBroom, FaUniversity, FaSearch, FaUnlock,
    FaMoneyBillWave, FaChartPie, FaEye, FaHandshake, FaLock, FaRocket, FaClock,
    FaVk, FaTelegram, FaEnvelope, FaPhone, FaArrowRight, FaMapMarkerAlt, FaUserCheck, FaWallet,
    FaLaptop, FaCamera, FaStethoscope, FaDumbbell, FaStore, FaGlassCheers, FaHome, FaSignOutAlt, FaCog
} from 'react-icons/fa';
import { Avatar } from '@chakra-ui/react';
import Logo from '../img/Logo.png';

// --- Animation Components ---
const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

// --- Demo Dashboard Component (Matching Real App) ---
const DemoDashboard = () => {
    const [activeTab, setActiveTab] = useState('Главная');
    const bg = "gray.50";
    const cardBg = "white";
    const borderColor = "gray.200";

    const Header = () => (
        <Box bg="white" borderBottom="1px solid" borderColor={borderColor} px={4} h={16}>
            <Flex h="full" alignItems="center" justify="space-between" maxW="container.xl" mx="auto">
                <HStack spacing={8}>
                    <Flex align="center">
                        <Image src={Logo} h="32px" mr={2} />
                    </Flex>
                    <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
                        {['Главная', 'Инструменты', 'Сотрудники', 'Склады'].map((text) => (
                            <Button
                                key={text}
                                variant="ghost"
                                size="sm"
                                color={text === activeTab ? 'blue.600' : 'gray.600'}
                                bg={text === activeTab ? 'blue.50' : 'transparent'}
                                leftIcon={text === 'Главная' ? <Icon as={FaChartPie} /> : text === 'Инструменты' ? <Icon as={FaTools} /> : text === 'Сотрудники' ? <Icon as={FaUsers} /> : <Icon as={FaWarehouse} />}
                                onClick={() => setActiveTab(text)}
                            >
                                {text}
                            </Button>
                        ))}
                    </HStack>

                    {/* Mobile Menu */}
                    <Box display={{ base: 'block', md: 'none' }}>
                        <Menu>
                            <MenuButton as={Button} size="sm" variant="outline" rightIcon={<Icon as={FaArrowRight} transform="rotate(90deg)" />}>
                                {activeTab}
                            </MenuButton>
                            <MenuList>
                                {['Главная', 'Инструменты', 'Сотрудники', 'Склады'].map((text) => (
                                    <MenuItem key={text} onClick={() => setActiveTab(text)} icon={text === 'Главная' ? <Icon as={FaChartPie} /> : text === 'Инструменты' ? <Icon as={FaTools} /> : text === 'Сотрудники' ? <Icon as={FaUsers} /> : <Icon as={FaWarehouse} />}>
                                        {text}
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </Menu>
                    </Box>
                </HStack>
                <HStack>
                    <Avatar size="sm" name="Алексей К." src="https://bit.ly/dan-abramov" />
                    <Box display={{ base: 'none', md: 'block' }}>
                        <Text fontSize="sm" fontWeight="medium">Алексей К.</Text>
                        <Text fontSize="xs" color="gray.500">Администратор</Text>
                    </Box>
                </HStack>
            </Flex>
        </Box>
    );

    const StatCard = ({ icon, label, value, sub, color }) => (
        <Box bg={cardBg} p={4} rounded="xl" border="1px solid" borderColor={borderColor} shadow="sm">
            <HStack mb={2} color="gray.500">
                <Icon as={icon} />
                <Text fontSize="sm">{label}</Text>
            </HStack>
            <Text fontSize="2xl" fontWeight="semibold" color={color || 'gray.800'}>{value}</Text>
            <Text fontSize="xs" color="gray.400">{sub}</Text>
        </Box>
    );



    const renderContent = () => {
        switch (activeTab) {
            case 'Инструменты':
                return (
                    <Box maxW="container.xl" mx="auto">
                        <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Heading size="lg" mb={2} color="gray.800">Инструменты</Heading>
                                <Text color="gray.500">Управление парком оборудования</Text>
                            </Box>
                            <Button leftIcon={<FaTools />} colorScheme="blue" size="md">Добавить инструмент</Button>
                        </Box>

                        <Box bg={cardBg} rounded="xl" border="1px solid" borderColor={borderColor} shadow="sm" overflow="hidden">
                            <Box px={6} py={4} borderBottom="1px solid" borderColor={borderColor} bg="gray.50">
                                <HStack spacing={4}>
                                    <Button size="sm" colorScheme="blue" variant="solid">Все</Button>
                                    <Button size="sm" variant="ghost" color="gray.600">В работе</Button>
                                    <Button size="sm" variant="ghost" color="gray.600">На складе</Button>
                                    <Button size="sm" variant="ghost" color="gray.600">Ремонт</Button>
                                </HStack>
                            </Box>
                            <Box overflowX="auto">
                                <Box minW="700px">
                                    <Grid templateColumns="3fr 1.5fr 1.5fr 1fr 1fr" gap={4} p={6} borderBottom="1px solid" borderColor="gray.100" color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase" bg="gray.50">
                                        <Text>Название / Модель</Text>
                                        <Text>Категория</Text>
                                        <Text>Статус</Text>
                                        <Text>Стоимость</Text>
                                        <Text>Действия</Text>
                                    </Grid>
                                    {[
                                        { name: 'Перфоратор Makita HR2470', cat: 'Электроинструмент', status: 'В работе', price: '12 500 ₽', color: 'blue' },
                                        { name: 'Шуруповерт Bosch GSR 120', cat: 'Электроинструмент', status: 'На складе', price: '8 900 ₽', color: 'green' },
                                        { name: 'Лазерный уровень ADA', cat: 'Измерительный', status: 'В работе', price: '15 200 ₽', color: 'blue' },
                                        { name: 'Болгарка DeWalt DWE4051', cat: 'Электроинструмент', status: 'Ремонт', price: '6 400 ₽', color: 'orange' },
                                        { name: 'Набор ключей Jonnesway', cat: 'Ручной', status: 'На складе', price: '14 500 ₽', color: 'green' },
                                        { name: 'Генератор Huter DY6500L', cat: 'Силовое', status: 'В работе', price: '45 000 ₽', color: 'blue' },
                                    ].map((tool, i) => (
                                        <Grid key={i} templateColumns="3fr 1.5fr 1.5fr 1fr 1fr" gap={4} p={5} borderBottom="1px solid" borderColor="gray.100" alignItems="center" _hover={{ bg: 'blue.50' }} transition="all 0.2s">
                                            <HStack>
                                                <Flex w={10} h={10} bg="gray.100" rounded="lg" align="center" justify="center" color="gray.500"><Icon as={FaTools} /></Flex>
                                                <Text fontWeight="medium" color="gray.800">{tool.name}</Text>
                                            </HStack>
                                            <Text color="gray.600" fontSize="sm">{tool.cat}</Text>
                                            <Badge colorScheme={tool.color} variant="subtle" w="fit-content" rounded="full" px={2} textTransform="none">{tool.status}</Badge>
                                            <Text color="gray.700" fontWeight="medium" fontSize="sm">{tool.price}</Text>
                                            <Icon as={FaCog} color="gray.400" cursor="pointer" />
                                        </Grid>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                );
            case 'Сотрудники':
                return (
                    <Box maxW="container.xl" mx="auto">
                        <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Heading size="lg" mb={2} color="gray.800">Сотрудники</Heading>
                                <Text color="gray.500">Персонал и доступ</Text>
                            </Box>
                            <Button leftIcon={<FaUsers />} colorScheme="blue" size="md">Добавить сотрудника</Button>
                        </Box>

                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            {['Иванов Андрей', 'Петров Сергей', 'Сидоров Максим', 'Козлов Дмитрий', 'Новиков Игорь', 'Смирнова Елена'].map((name, i) => (
                                <Box key={i} bg={cardBg} p={6} border="1px solid" borderColor={borderColor} rounded="xl" shadow="sm" _hover={{ shadow: 'md', borderColor: 'blue.200' }} transition="all 0.2s">
                                    <HStack spacing={4} mb={4}>
                                        <Avatar name={name} size="md" bg="blue.500" color="white" />
                                        <Box>
                                            <Text fontWeight="bold" color="gray.800">{name}</Text>
                                            <Text fontSize="xs" color="gray.500">Бригадир • {i === 0 || i === 2 ? 'На объекте' : 'Свободен'}</Text>
                                        </Box>
                                    </HStack>
                                    <Divider mb={4} />
                                    <HStack justify="space-between" fontSize="sm">
                                        <Text color="gray.500">Инструментов:</Text>
                                        <Text fontWeight="bold" color="gray.800">{Math.floor(Math.random() * 5)} шт.</Text>
                                    </HStack>
                                    <HStack justify="space-between" fontSize="sm" mt={2}>
                                        <Text color="gray.500">Телефон:</Text>
                                        <Text color="blue.600">+7 (999) 000-00-0{i}</Text>
                                    </HStack>
                                </Box>
                            ))}
                        </SimpleGrid>
                    </Box>
                );
            case 'Склады':
                return (
                    <Box maxW="container.xl" mx="auto">
                        <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Heading size="lg" mb={2} color="gray.800">Склады</Heading>
                                <Text color="gray.500">Места хранения ТМЦ</Text>
                            </Box>
                            <Button leftIcon={<FaWarehouse />} colorScheme="blue" size="md">Добавить склад</Button>
                        </Box>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            {[
                                { name: 'Центральный склад', addr: 'ул. Ленина, 10', items: 1543, color: 'blue' },
                                { name: 'Объект "Север"', addr: 'Московское шоссе, 25км', items: 320, color: 'orange' },
                                { name: 'Объект "ЖК Парк"', addr: 'ул. Гагарина, 5', items: 125, color: 'orange' },
                                { name: 'Ремзона', addr: 'ул. Промышленная, 3', items: 45, color: 'purple' },
                            ].map((wh, i) => (
                                <Box key={i} bg={cardBg} p={6} border="1px solid" borderColor={borderColor} rounded="xl" shadow="sm" position="relative" overflow="hidden">
                                    <Box position="absolute" top={0} left={0} w="4px" h="full" bg={`${wh.color}.500`} />
                                    <HStack justify="space-between" mb={2}>
                                        <Heading size="md" color="gray.800">{wh.name}</Heading>
                                        <Badge colorScheme={wh.color}>{wh.color === 'blue' ? 'Главный' : wh.color === 'purple' ? 'Сервис' : 'Объект'}</Badge>
                                    </HStack>
                                    <HStack color="gray.500" fontSize="sm" mb={6}>
                                        <Icon as={FaMapMarkerAlt} />
                                        <Text>{wh.addr}</Text>
                                    </HStack>
                                    <HStack justify="space-between" align="end">
                                        <Box>
                                            <Text fontSize="2xl" fontWeight="bold" color="gray.800">{wh.items}</Text>
                                            <Text fontSize="xs" color="gray.500">позиций</Text>
                                        </Box>
                                        <Button size="sm" variant="outline" colorScheme="blue">Открыть</Button>
                                    </HStack>
                                </Box>
                            ))}
                        </SimpleGrid>
                    </Box>
                );
            default: // Главная
                return (
                    <VStack spacing={6} align="stretch" maxW="container.xl" mx="auto">
                        <Box>
                            <Heading size="lg" mb={2} color="gray.800">Панель Администратора</Heading>
                            <Text color="gray.500">Общая статистика системы ToolManager</Text>
                        </Box>

                        {/* Stats Grid */}
                        <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4}>
                            <StatCard icon={FaMoneyBillWave} label="Общая Стоимость" value="4 250 000 ₽" sub="В оборудовании" />
                            <StatCard icon={FaLock} label="В Работе" value="86" sub="60% использования" color="blue.500" />
                            <StatCard icon={FaWarehouse} label="На складе" value="56" sub="Доступно" color="green.500" />
                            <StatCard icon={FaTools} label="Всего" value="142" sub="В системе" />
                            <StatCard icon={FaUsers} label="Сотрудников" value="24" sub="Зарегистрировано" />
                        </SimpleGrid>

                        {/* Charts & Activity Row */}
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                            {/* Fake Pie Chart Card */}
                            <Box bg={cardBg} p={6} rounded="xl" border="1px solid" borderColor={borderColor} shadow="sm">
                                <Heading size="md" mb={6} color="gray.800">Распределение по категориям</Heading>
                                <Flex h={{ base: 'auto', md: '250px' }} direction={{ base: 'column', md: 'row' }} align="center" justify="center" gap={{ base: 6, md: 0 }}>
                                    {/* CSS Circle Simulation for Pie Chart */}
                                    <Box w="200px" h="200px" rounded="full" bgGradient="conic-gradient(#3182CE 0% 35%, #38A169 35% 60%, #805AD5 60% 80%, #ECC94B 80% 100%)" position="relative" flexShrink={0}>
                                        <Box position="absolute" inset="40px" bg="white" rounded="full" display="flex" alignItems="center" justifyContent="center">
                                            <Text fontSize="lg" fontWeight="bold" color="gray.600">Categories</Text>
                                        </Box>
                                    </Box>
                                    <VStack align="start" ml={{ base: 0, md: 8 }} spacing={2} w="full">
                                        <HStack><Box w={3} h={3} bg="blue.500" rounded="full" /><Text fontSize="sm">Электроинструмент (35%)</Text></HStack>
                                        <HStack><Box w={3} h={3} bg="green.500" rounded="full" /><Text fontSize="sm">Ручной (25%)</Text></HStack>
                                        <HStack><Box w={3} h={3} bg="purple.500" rounded="full" /><Text fontSize="sm">Измерительный (20%)</Text></HStack>
                                        <HStack><Box w={3} h={3} bg="yellow.400" rounded="full" /><Text fontSize="sm">Расходники (20%)</Text></HStack>
                                    </VStack>
                                </Flex>
                            </Box>

                            {/* Activity Feed */}
                            <Box bg={cardBg} p={6} rounded="xl" border="1px solid" borderColor={borderColor} shadow="sm">
                                <HStack justify="space-between" mb={6}>
                                    <HStack>
                                        <Icon as={FaChartLine} />
                                        <Heading size="md" color="gray.800">Лента Активности</Heading>
                                    </HStack>
                                    <Badge colorScheme="blue" display={{ base: 'none', sm: 'block' }}>Последние перемещения</Badge>
                                </HStack>
                                <VStack align="stretch" spacing={4}>
                                    {[
                                        { text: "Иванов А. получил Перфоратор Makita", time: "5 мин. назад", type: "transfer" },
                                        { text: "Петров С. вернул Лазерный уровень", time: "25 мин. назад", type: "return" },
                                        { text: "Сидоров М. получил Набор ключей", time: "1 час назад", type: "transfer" },
                                        { text: "Новый инструмент: Дрель Bosch добавлен", time: "2 часа назад", type: "new" },
                                        { text: "Иванов А. получил Болгарку", time: "Вчера", type: "transfer" },
                                    ].map((item, i) => (
                                        <Box key={i}>
                                            <Text fontSize="sm" fontWeight="medium" color="gray.800">{item.text}</Text>
                                            <HStack mt={1} spacing={2}>
                                                <Text fontSize="xs" color="gray.400">{item.time}</Text>
                                                <Badge fontSize="xs" colorScheme={item.type === 'transfer' ? 'blue' : item.type === 'return' ? 'green' : 'purple'}>
                                                    {item.type === 'transfer' ? 'Передача' : item.type === 'return' ? 'Возврат' : 'Система'}
                                                </Badge>
                                            </HStack>
                                            {i < 4 && <Divider mt={3} />}
                                        </Box>
                                    ))}
                                </VStack>
                            </Box>
                        </SimpleGrid>
                    </VStack>
                );
        }
    };

    return (
        <Box bg={bg} borderRadius="xl" overflow="hidden" position="relative" height={{ base: 'auto', md: '600px' }} border="1px solid" borderColor="gray.200" display="flex" flexDirection="column">
            <Header />
            <Box p={6} overflowY="auto" flex={1}>
                {renderContent()}
            </Box>
        </Box>
    );
};


// --- Navbar ---
const Navbar = ({ navigate }) => (
    <Box
        as="nav"
        position="fixed"
        w="100%"
        zIndex={100}
        bg="rgba(255, 255, 255, 0.9)"
        backdropFilter="blur(20px)"
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="sm"
    >
        <Container maxW="container.xl" py={4}>
            <Flex justify="space-between" align="center">
                <Flex align="center" cursor="pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <Image src={Logo} alt="ToolManager Logo" h="40px" objectFit="contain" mr={3} />
                    <Heading size="md" color="gray.800" letterSpacing="tight" display={{ base: 'none', md: 'block' }}>
                        ToolManager
                    </Heading>
                </Flex>

                <Flex gap={{ base: 2, md: 4 }}>
                    <Button
                        variant="ghost"
                        color="gray.600"
                        _hover={{ bg: 'gray.100', color: 'gray.900' }}
                        onClick={() => navigate('/login')}
                        size={{ base: 'sm', md: 'md' }}
                    >
                        Войти
                    </Button>
                    <Button
                        colorScheme="blue"
                        bg="blue.600"
                        color="white"
                        _hover={{ bg: "blue.700" }}
                        onClick={() => navigate('/register')}
                        boxShadow="md"
                        size={{ base: 'sm', md: 'md' }}
                    >
                        Начать бесплатно
                    </Button>
                </Flex>
            </Flex>
        </Container>
    </Box>
);

// --- Hero Section ---
const HeroSection = ({ navigate }) => {
    return (
        <Box
            position="relative"
            minH="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="white"
            overflow="hidden"
            pt={20}
        >


            <Container maxW="container.xl" position="relative" zIndex={1} textAlign="center">
                <VStack spacing={8} maxW="800px" mx="auto">



                    <MotionHeading
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        fontSize={{ base: '32px', sm: '4xl', md: '5xl', lg: '6xl' }}
                        fontWeight="900"
                        lineHeight="1.1"
                        color="gray.900"
                        letterSpacing="tight"
                        wordBreak="break-word"
                    >
                        Порядок в инструментах — <br />
                        <Text as="span" bgGradient="linear(to-r, blue.600, blue.400)" bgClip="text">
                            прибыль в бизнесе
                        </Text>
                    </MotionHeading>

                    <MotionText
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        fontSize="xl"
                        color="gray.500"
                        maxW="2xl"
                        lineHeight="1.6"
                    >
                        Забудьте о Excel и бумажных журналах. ToolManager — это цифровая экосистема, которая исключает кражи, потери и простои. Полный контроль активов в вашем кармане 24/7.
                    </MotionText>

                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        pt={4}
                        display="flex"
                        flexDirection={{ base: 'column', sm: 'row' }}
                        gap={4}
                        justifyContent="center"
                    >
                        <Button
                            size="lg"
                            h="64px"
                            px={10}
                            fontSize="lg"
                            colorScheme="blue"
                            bg="blue.600"
                            rounded="2xl"
                            _hover={{ bg: 'blue.700', transform: 'translateY(-2px)', boxShadow: 'xl' }}
                            transition="all 0.2s"
                            rightIcon={<Icon as={FaArrowRight} />}
                            onClick={() => navigate('/register')}
                        >
                            Начать бесплатно
                        </Button>
                        <Button
                            size="lg"
                            h="64px"
                            px={10}
                            fontSize="lg"
                            color="gray.700"
                            bg="white"
                            border="1px solid"
                            borderColor="gray.200"
                            rounded="2xl"
                            _hover={{ bg: 'gray.50', transform: 'translateY(-2px)' }}
                            leftIcon={<Icon as={FaSearch} />}
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Узнать больше
                        </Button>
                    </MotionBox>

                    <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <HStack spacing={4} color="gray.400" fontSize="sm" justify="center" mt={2}>
                            <HStack><Icon as={FaCheckCircle} color="green.500" /><Text>14 дней пробный период</Text></HStack>
                            <HStack><Icon as={FaCheckCircle} color="green.500" /><Text>Без привязки карты</Text></HStack>
                            <HStack><Icon as={FaCheckCircle} color="green.500" /><Text>Быстрый старт</Text></HStack>
                        </HStack>
                    </MotionBox>
                </VStack>

                {/* Dashboard Preview Mockup (Light Mode) */}
                <MotionBox
                    initial={{ opacity: 0, y: 50, rotateX: 20 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 }}
                    mt={20}
                    mx="auto"
                    maxW="1200px"
                    bg="white"
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="gray.200"
                    boxShadow="2xl"
                    p={2}
                >
                    <DemoDashboard />
                </MotionBox>
            </Container>
        </Box>
    );
};

// --- Values / Problems Section (Horizontal Cards) ---
const ValuesSection = () => (
    <Box py={24} bg="gray.50">
        <Container maxW="container.xl">
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                {[
                    { title: "Тотальный контроль", desc: "Вы всегда знаете, где находится каждый шуруповерт.", icon: FaMapMarkerAlt, color: "blue.500" },
                    { title: "Личная ответственность", desc: "Сотрудники подтверждают получение инструмента через приложение.", icon: FaUserCheck, color: "green.500" },
                    { title: "Экономия бюджета", desc: "Прекратите покупать одно и то же по 10 раз.", icon: FaWallet, color: "purple.500" }
                ].map((item, idx) => (
                    <VStack
                        key={idx}
                        bg="white"
                        p={8}
                        rounded="2xl"
                        align="start"
                        border="1px solid"
                        borderColor="gray.100"
                        boxShadow="lg"
                        transition="all 0.3s"
                        _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl' }}
                    >
                        <Flex w={12} h={12} bg={`${item.color.split('.')[0]}.50`} rounded="xl" align="center" justify="center" mb={4}>
                            <Icon as={item.icon} w={6} h={6} color={item.color} />
                        </Flex>
                        <Heading size="md" color="gray.800" mb={2}>{item.title}</Heading>
                        <Text color="gray.600">{item.desc}</Text>
                    </VStack>
                ))}
            </SimpleGrid>
        </Container>
    </Box>
);

// --- Features Bento Grid ---
const BentoGrid = () => (
    <Box id="features" py={24} bg="white">
        <Container maxW="container.xl">
            <VStack mb={16} spacing={4} textAlign="center">
                <Text color="blue.600" fontWeight="bold" letterSpacing="wide" textTransform="uppercase">
                    Возможности
                </Text>
                <Heading size="2xl" color="gray.900">
                    Всё для управления <br /> в одной системе
                </Heading>
            </VStack>

            <Grid
                templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
                templateRows={{ base: "auto", md: "repeat(2, 280px)" }}
                gap={6}
            >
                {/* Large Item */}
                <GridItem colSpan={{ base: 1, md: 2 }} rowSpan={{ base: 1, md: 2 }} bg="gray.50" rounded="3xl" p={8} border="1px solid" borderColor="gray.100" position="relative" overflow="hidden" _hover={{ borderColor: 'blue.200' }} transition="all 0.3s">
                    <Box position="absolute" top={10} right={-10} p={4} opacity={0.1} transform="rotate(15deg)">
                        <Icon as={FaMobileAlt} w={64} h={64} color="blue.500" />
                    </Box>
                    <VStack align="start" h="full" justify="space-between" position="relative" zIndex={1}>
                        <Box>
                            <Flex w={12} h={12} bg="blue.100" rounded="xl" align="center" justify="center" mb={6}>
                                <Icon as={FaMobileAlt} w={6} h={6} color="blue.600" />
                            </Flex>
                            <Heading size="lg" color="gray.900" mb={4}>Мобильное приложение</Heading>
                            <Text color="gray.600" fontSize="lg">Полноценный доступ с любого устройства. Сканируйте QR-коды, принимайте и передавайте инструмент прямо на объекте.</Text>
                        </Box>
                        <Button variant="link" color="blue.600" rightIcon={<FaArrowRight />}>Подробнее</Button>
                    </VStack>
                </GridItem>

                {/* Medium Items */}
                <GridItem colSpan={1} bg="white" rounded="3xl" p={8} border="1px solid" borderColor="gray.200" boxShadow="sm" _hover={{ shadow: 'md' }} transition="all 0.3s">
                    <Icon as={FaHistory} w={8} h={8} color="purple.500" mb={4} />
                    <Heading size="md" color="gray.900" mb={2}>История</Heading>
                    <Text color="gray.600">Полная история перемещений каждого предмета с момента покупки.</Text>
                </GridItem>

                <GridItem colSpan={1} bg="white" rounded="3xl" p={8} border="1px solid" borderColor="gray.200" boxShadow="sm" _hover={{ shadow: 'md' }} transition="all 0.3s">
                    <Icon as={FaQrcode} w={8} h={8} color="green.500" mb={4} />
                    <Heading size="md" color="gray.900" mb={2}>QR Сканер</Heading>
                    <Text color="gray.600">Мгновенная инвентаризация по кодам. Печать этикеток в один клик.</Text>
                </GridItem>

                {/* Wide Item */}
                <GridItem colSpan={{ base: 1, md: 2 }} bg="blue.600" rounded="3xl" p={8} display="flex" alignItems="center" position="relative" overflow="hidden">
                    <Box position="absolute" inset={0} bgGradient="linear(to-br, blue.600, blue.800)" />
                    <HStack spacing={8} position="relative" zIndex={1}>
                        <Flex w={20} h={20} bg="whiteAlpha.200" rounded="2xl" align="center" justify="center" border="1px solid rgba(255,255,255,0.2)">
                            <Icon as={FaChartPie} w={8} h={8} color="white" />
                        </Flex>
                        <Box>
                            <Heading size="lg" color="white" mb={2}>Аналитика и Отчеты</Heading>
                            <Text color="blue.100" fontSize="lg">Понимайте реальную стоимость владения и потери. Принимайте решения на основе данных.</Text>
                        </Box>
                    </HStack>
                </GridItem>
            </Grid>
        </Container>
    </Box>
);

// --- Stats Section ---


// --- Industries Section ---
const IndustriesSection = () => (
    <Box id="industries" py={24} bg="white">
        <Container maxW="container.xl">
            <VStack mb={16} spacing={4} textAlign="center">
                <Text color="blue.600" fontWeight="bold" letterSpacing="wide" textTransform="uppercase">
                    Сферы применения
                </Text>
                <Heading size="2xl" color="gray.900">Универсальное решение <br /> для любого бизнеса</Heading>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                {[
                    { title: "Строительство", desc: "Контроль инструмента на объектах, учет перемещений между бригадами.", icon: FaHardHat, color: "orange.400" },
                    { title: "Ритейл и Склады", desc: "Терминалы сбора данных, кассы, сканеры и складская техника.", icon: FaStore, color: "blue.500" },
                    { title: "Event-агентства", desc: "Сценические конструкции, звук, свет и декор. Контроль возврата после мероприятий.", icon: FaGlassCheers, color: "pink.500" },
                    { title: "Производство", desc: "Учет станков, запчастей и инструмента в цехах.", icon: FaWarehouse, color: "green.500" },
                ].map((item, index) => (
                    <HStack
                        key={index}
                        bg="white"
                        p={8}
                        rounded="2xl"
                        border="1px solid"
                        borderColor="gray.100"
                        boxShadow="lg"
                        align="start"
                        spacing={6}
                        transition="all 0.3s"
                        _hover={{ transform: 'translateY(-5px)', shadow: 'xl', borderColor: 'blue.100' }}
                    >
                        <Flex
                            shrink={0}
                            w={16} h={16}
                            bg={`${item.color.split('.')[0]}.50`}
                            rounded="2xl"
                            align="center"
                            justify="center"
                            color={item.color}
                        >
                            <Icon as={item.icon} w={8} h={8} />
                        </Flex>
                        <Box>
                            <Heading size="md" color="gray.900" mb={3}>{item.title}</Heading>
                            <Text color="gray.600" lineHeight="tall">{item.desc}</Text>
                        </Box>
                    </HStack>
                ))}
            </SimpleGrid>
        </Container>
    </Box>
);

// --- Pricing / Feature List Section ---
const includedFeatures = [
    { icon: FaMobileAlt, title: "Мобильное приложение", desc: "iOS и Android" },
    { icon: FaBell, title: "Push уведомления", desc: "Мгновенные оповещения" },
    { icon: FaFileImport, title: "Импорт из Excel", desc: "Быстрый старт" },
    { icon: FaWarehouse, title: "Мульти-склад", desc: "Любое количество объектов" },
    { icon: FaQrcode, title: "QR Маркировка", desc: "Печать и сканирование" },
    { icon: FaChartPie, title: "Умные отчеты", desc: "Полная аналитика" },
    { icon: FaHandshake, title: "Внешние подрядчики", desc: "Учет передачи третьим лицам" },
    { icon: FaUserTie, title: "Поддержка 24/7", desc: "Персональный менеджер" },
];

const PricingSection = () => (
    <Box id="pricing" py={24} bg="gray.50">
        <Container maxW="container.xl" bg="blue.600" rounded="3xl" p={{ base: 8, md: 16 }} position="relative" overflow="hidden" boxShadow="2xl">
            {/* Background Pattern */}
            <Box position="absolute" inset={0} opacity={0.1} bgImage="radial-gradient(#ffffff 1px, transparent 1px)" bgSize="20px 20px" />

            <VStack spacing={8} position="relative" zIndex={1} textAlign="center" mb={12}>
                <Heading size="2xl" color="white">Всё включено в каждый тариф</Heading>
                <Text fontSize="lg" color="blue.50">Никаких скрытых доплат за модули. Вы получаете полную версию системы.</Text>
            </VStack>

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} position="relative" zIndex={1}>
                {includedFeatures.map((item, idx) => (
                    <VStack
                        key={idx}
                        bg="whiteAlpha.200"
                        p={6}
                        rounded="xl"
                        transition="all 0.2s"
                        _hover={{ bg: 'whiteAlpha.300', transform: 'scale(1.02)' }}
                    >
                        <Icon as={item.icon} w={8} h={8} color="white" mb={2} />
                        <Text color="white" fontWeight="bold">{item.title}</Text>
                        <Text color="blue.100" fontSize="xs">{item.desc}</Text>
                    </VStack>
                ))}
            </SimpleGrid>

            <Flex justify="center" mt={12} position="relative" zIndex={1}>
                <Button size="lg" bg="white" color="blue.600" _hover={{ bg: 'gray.50' }} px={12} fontSize="xl" boxShadow="lg">
                    Выбрать тариф
                </Button>
            </Flex>
        </Container>
    </Box>
);

// --- Footer ---
const Footer = ({ scrollToSection }) => (
    <Box bg="gray.900" color="gray.400" py={16}>
        <Container maxW="container.xl">
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={12}>
                <VStack align="start">
                    <Flex align="center" mb={4}>
                        <Image src={Logo} h="32px" mr={2} filter="brightness(0) invert(1)" />
                        <Heading size="md" color="white">ToolManager</Heading>
                    </Flex>
                    <Text fontSize="sm">
                        Современная система учета материальных ценностей.
                        <br />
                        © 2026 ToolManager Inc.
                    </Text>
                </VStack>

                <VStack align="start">
                    <Heading size="sm" color="white" mb={4}>Продукт</Heading>
                    <Text cursor="pointer" _hover={{ color: "white" }} onClick={() => scrollToSection('features')}>Возможности</Text>
                    <Text cursor="pointer" _hover={{ color: "white" }} onClick={() => scrollToSection('industries')}>Для кого</Text>
                    <Text cursor="pointer" _hover={{ color: "white" }} onClick={() => scrollToSection('pricing')}>Цена</Text>
                </VStack>

                <VStack align="start">
                    <Heading size="sm" color="white" mb={4}>Компания</Heading>
                    <Text>О нас</Text>
                    <Text>Блог</Text>
                    <Text>Карьера</Text>
                </VStack>

                <VStack align="start">
                    <Heading size="sm" color="white" mb={4}>Контакты</Heading>
                    <HStack>
                        <Icon as={FaEnvelope} />
                        <Text>hello@toolmanager.io</Text>
                    </HStack>
                    <HStack spacing={4} mt={4}>
                        <Icon as={FaVk} w={5} h={5} cursor="pointer" _hover={{ color: "white" }} />
                        <Icon as={FaTelegram} w={5} h={5} cursor="pointer" _hover={{ color: "white" }} />
                    </HStack>
                </VStack>
            </SimpleGrid>
        </Container>
    </Box>
);

// --- Main Page Component ---
const LandingPage = () => {
    const navigate = useNavigate();

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <Box bg="white" minH="100vh" fontFamily="'Inter', sans-serif">
            <Navbar navigate={navigate} />

            <HeroSection navigate={navigate} />
            <ValuesSection />
            <BentoGrid />

            <IndustriesSection />
            <PricingSection />

            <Footer scrollToSection={scrollToSection} />
        </Box>
    );
};

export default LandingPage;
