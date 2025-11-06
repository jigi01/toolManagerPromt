import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import BossRoute from '../components/BossRoute';
import PermissionRoute from '../components/PermissionRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardAdmin from '../pages/DashboardAdmin';
import DashboardEmployee from '../pages/DashboardEmployee';
import ToolsPage from '../pages/ToolsPage';
import ToolDetailsPage from '../pages/ToolDetailsPage';
import UsersPage from '../pages/UsersPage';
import RolesPage from '../pages/RolesPage';
import WarehousesPage from '../pages/WarehousesPage';
import SettingsPage from '../pages/SettingsPage';
import useAuthStore from '../store/authStore';

const HomePage = () => {
  const { isBoss } = useAuthStore();
  return isBoss ? <DashboardAdmin /> : <DashboardEmployee />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="TOOL_READ">
                <Layout>
                  <ToolsPage />
                </Layout>
              </PermissionRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ToolDetailsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="USER_READ">
                <Layout>
                  <UsersPage />
                </Layout>
              </PermissionRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <BossRoute>
                <Layout>
                  <RolesPage />
                </Layout>
              </BossRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/warehouses"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="WAREHOUSE_READ">
                <Layout>
                  <WarehousesPage />
                </Layout>
              </PermissionRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
