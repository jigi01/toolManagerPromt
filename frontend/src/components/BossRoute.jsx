import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import useAuthStore from '../store/authStore';

const BossRoute = ({ children }) => {
  const { isBoss, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!isBoss) {
    return <Navigate to="/" replace />;
  }

  return <Box>{children}</Box>;
};

export default BossRoute;
