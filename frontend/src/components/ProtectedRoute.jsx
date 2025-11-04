import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, checkAuth } = useAuthStore();
  const location = useLocation();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Box>{children}</Box>;
};

export default ProtectedRoute;
