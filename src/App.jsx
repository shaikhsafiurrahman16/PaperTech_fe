import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { message } from 'antd';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import CustomerList from './pages/customers/CustomerList';
import ProductList from './pages/products/ProductList';
import SalesHistory from './pages/sales/SalesHistory';
import PaymentList from './pages/payments/PaymentList';
import Reports from './pages/reports/Reports';
import LedgerView from './pages/ledger/LedgerView';
import DashboardLayout from './components/layout/DashboardLayout';

function getHomePath(user) {
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
