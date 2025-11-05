import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import useAuthStore from '../store/authStore';

const PermissionRoute = ({ children, permission, anyOf }) => {
  const { hasPermission, hasAnyPermission, loading, checkAuth } = useAuthStore();

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

  const allowed = anyOf 
    ? hasAnyPermission(anyOf)
    : hasPermission(permission);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Box>{children}</Box>;
};

export default PermissionRoute;
