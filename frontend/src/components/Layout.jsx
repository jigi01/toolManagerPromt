import { Box, Flex, Button, Text, Container, useColorModeValue, HStack, Menu, MenuButton, MenuList, MenuItem, Avatar } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiTool, FiUsers, FiHome } from 'react-icons/fi';
import useAuthStore from '../store/authStore';

const Layout = ({ children }) => {
  const { user, isAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} px={4} shadow="sm">
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <HStack spacing={8}>
              <Text fontSize="xl" fontWeight="bold" color="blue.500">
                🔧 ToolManager
              </Text>
              <HStack spacing={4}>
                <Button
                  as={Link}
                  to="/"
                  leftIcon={<FiHome />}
                  variant="ghost"
                  size="sm"
                >
                  Главная
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      as={Link}
                      to="/tools"
                      leftIcon={<FiTool />}
                      variant="ghost"
                      size="sm"
                    >
                      Инструменты
                    </Button>
                    <Button
                      as={Link}
                      to="/users"
                      leftIcon={<FiUsers />}
                      variant="ghost"
                      size="sm"
                    >
                      Сотрудники
                    </Button>
                  </>
                )}
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
                      {isAdmin ? 'Администратор' : 'Сотрудник'}
                    </Text>
                  </Box>
                </HStack>
              </MenuButton>
              <MenuList>
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
    </Box>
  );
};

export default Layout;
