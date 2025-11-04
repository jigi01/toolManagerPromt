import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardAdmin from '../pages/DashboardAdmin';
import DashboardEmployee from '../pages/DashboardEmployee';
import ToolsPage from '../pages/ToolsPage';
import ToolDetailsPage from '../pages/ToolDetailsPage';
import UsersPage from '../pages/UsersPage';
import useAuthStore from '../store/authStore';

const HomePage = () => {
  const { isAdmin } = useAuthStore();
  return isAdmin ? <DashboardAdmin /> : <DashboardEmployee />;
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
              <AdminRoute>
                <Layout>
                  <ToolsPage />
                </Layout>
              </AdminRoute>
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
              <AdminRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
