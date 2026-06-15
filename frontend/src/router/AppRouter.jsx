import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import BossRoute from '../components/BossRoute';
import PermissionRoute from '../components/PermissionRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import CompleteRegistrationPage from '../pages/CompleteRegistrationPage';
import DashboardAdmin from '../pages/DashboardAdmin';
import DashboardEmployee from '../pages/DashboardEmployee';
import ToolsPage from '../pages/ToolsPage';
import ToolDetailsPage from '../pages/ToolDetailsPage';
import UsersPage from '../pages/UsersPage';
import UserProfilePage from '../pages/UserProfilePage';
import RolesPage from '../pages/RolesPage';
import WarehousesPage from '../pages/WarehousesPage';
import SettingsPage from '../pages/SettingsPage';
import LandingPage from '../pages/LandingPage';
import TasksPage from '../pages/TasksPage';
import PageTransition from '../components/PageTransition';
import useAuthStore from '../store/authStore';

const HomePage = () => {
  const { isBoss } = useAuthStore();
  return isBoss ? <DashboardAdmin /> : <DashboardEmployee />;
};

const AppRouter = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/complete-registration" element={<PageTransition><CompleteRegistrationPage /></PageTransition>} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <HomePage />
                </PageTransition>
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
                  <PageTransition>
                    <ToolsPage />
                  </PageTransition>
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
                <PageTransition>
                  <ToolDetailsPage />
                </PageTransition>
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
                  <PageTransition>
                    <UsersPage />
                  </PageTransition>
                </Layout>
              </PermissionRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="USER_READ">
                <Layout>
                  <PageTransition>
                    <UserProfilePage />
                  </PageTransition>
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
                  <PageTransition>
                    <RolesPage />
                  </PageTransition>
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
                  <PageTransition>
                    <WarehousesPage />
                  </PageTransition>
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
                <PageTransition>
                  <SettingsPage />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <TasksPage />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRouter;
