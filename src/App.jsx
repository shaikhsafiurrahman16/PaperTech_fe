import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { message } from 'antd';
import Login from './pages/auth/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import { firstAllowedPath } from './lib/accessModules';
import useOverlayFormUx from './hooks/useOverlayFormUx';

const adminHomeRoutes = [
  { path: '/dashboard', module: 'dashboard' },
  { path: '/users', module: 'users' },
  { path: '/customers', module: 'customers' },
  { path: '/vendors', module: 'vendors' },
  { path: '/purchases', module: 'purchases' },
  { path: '/products', module: 'products' },
  { path: '/sales', module: 'sales' },
  { path: '/invoices', module: 'invoices' },
  { path: '/payments', module: 'payments' },
  { path: '/reports', module: 'reports' },
  { path: '/chat', module: 'chat' },
];

function getHomePath(user) {
  if (user?.role === 'super_admin') return '/companies';
  if (user?.role === 'customer') return '/sales';
  if (user?.role === 'vendor') return '/purchases';
  return firstAllowedPath(user, adminHomeRoutes);
}

function PublicRoute({ children }) {
  const auth = useSelector(state => state.auth);

  if (auth.token) {
    return <Navigate to={getHomePath(auth.user)} replace />;
  }

  return children;
}

function ProtectedRoute({ children }) {
  const auth = useSelector(state => state.auth);
  const shouldRedirect = !auth.token;

  useEffect(() => {
    if (shouldRedirect) {
      message.warning('Please login to continue');
    }
  }, [shouldRedirect]);

  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  useOverlayFormUx();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
