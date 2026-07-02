import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { message } from 'antd';
import Login from './pages/auth/Login';
import DashboardLayout from './components/layout/DashboardLayout';

function getHomePath(user) {
  if (user?.role === 'super_admin') return '/companies';
  if (user?.role === 'customer') return '/sales';
  if (user?.role === 'vendor') return '/purchases';
  return '/dashboard';
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
