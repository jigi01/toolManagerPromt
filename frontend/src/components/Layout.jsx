import { Box, Flex, Button, Text, Container, useColorModeValue, HStack, Menu, MenuButton, MenuList, MenuItem, Avatar, MenuDivider, Image, IconButton, Drawer, DrawerBody, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, VStack, useDisclosure } from '@chakra-ui/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiTool, FiUsers, FiHome, FiShield, FiPackage, FiSettings, FiMenu, FiCheckSquare, FiUser } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import Logo from '../img/Logo.png';

const Layout = ({ children }) => {
  const { user, isBoss, hasPermission, logout } = useAuthStore();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavLink = ({ to, icon, children }) => {
    const isActive = location.pathname === to;
    return (
      <Button
        as={Link}
        to={to}
        leftIcon={icon}
        variant={isActive ? "solid" : "ghost"}
        colorScheme={isActive ? "blue" : "gray"}
        size="sm"
        w="full"
        justifyContent="flex-start"
        onClick={onClose}
      >
        {children}
      </Button>
    );
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} px={4} shadow="sm">
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <HStack spacing={4}>
              <IconButton
                display={{ base: 'flex', md: 'none' }}
                onClick={onOpen}
                variant="ghost"
                aria-label="open menu"
                icon={<FiMenu />}
              />
              <Link to="/dashboard">
                <Image src={Logo} alt="ToolManager" h="40px" objectFit="contain" />
              </Link>

              {/* Desktop Nav */}
              <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
                <Button as={Link} to="/dashboard" leftIcon={<FiHome />} variant="ghost" size="sm">Главная</Button>
                <Button as={Link} to="/tasks" leftIcon={<FiCheckSquare />} variant="ghost" size="sm">Задачи</Button>
                {hasPermission('TOOL_READ') && <Button as={Link} to="/tools" leftIcon={<FiTool />} variant="ghost" size="sm">Инструменты</Button>}
                {hasPermission('USER_READ') && <Button as={Link} to="/users" leftIcon={<FiUsers />} variant="ghost" size="sm">Сотрудники</Button>}
                {hasPermission('WAREHOUSE_READ') && <Button as={Link} to="/warehouses" leftIcon={<FiPackage />} variant="ghost" size="sm">Склады</Button>}
                {isBoss && <Button as={Link} to="/roles" leftIcon={<FiShield />} variant="ghost" size="sm">Роли</Button>}
              </HStack>
            </HStack>

            <Menu>
              <MenuButton as={Button} variant="ghost" cursor="pointer">
                <HStack>
                  <Avatar size="sm" name={user?.name} />
                  <Box textAlign="left">
                    <Text fontSize="sm" fontWeight="medium">
                      {user?.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {user?.role?.name || 'Сотрудник'}
                    </Text>
                  </Box>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiUser />} as={Link} to={`/users/${user?.id}`}>
                  Профиль
                </MenuItem>
                <MenuItem icon={<FiSettings />} as={Link} to="/settings">
                  Настройки
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                  Выйти
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
      {/* Mobile Nav Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Меню</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} mt={4} align="stretch">
              <NavLink to="/dashboard" icon={<FiHome />}>Главная</NavLink>
              <NavLink to="/tasks" icon={<FiCheckSquare />}>Задачи</NavLink>
              {hasPermission('TOOL_READ') && <NavLink to="/tools" icon={<FiTool />}>Инструменты</NavLink>}
              {hasPermission('USER_READ') && <NavLink to="/users" icon={<FiUsers />}>Сотрудники</NavLink>}
              {hasPermission('WAREHOUSE_READ') && <NavLink to="/warehouses" icon={<FiPackage />}>Склады</NavLink>}
              {isBoss && <NavLink to="/roles" icon={<FiShield />}>Роли</NavLink>}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Layout;
