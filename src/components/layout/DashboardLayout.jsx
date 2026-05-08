import { Layout, theme, Button, Dropdown, Space, ConfigProvider } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BgColorsOutlined, UserOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import AdminDashboard from '../../pages/dashboard/AdminDashboard';
import CustomerList from '../../pages/customers/CustomerList';
import ProductList from '../../pages/products/ProductList';
import SalesHistory from '../../pages/sales/SalesHistory';
import PaymentList from '../../pages/payments/PaymentList';
import Reports from '../../pages/reports/Reports';
import LedgerView from '../../pages/ledger/LedgerView';
import CustomerSalesPage from '../../pages/sales/CustomerSalesPage';

const { Header, Content, Sider } = Layout;

function DashboardLayout() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('papertech_darkMode') === 'true');
  const { user } = useSelector(state => state.auth);
  
  const {
    token: { colorBgContainer, colorText, colorPrimaryBorder, colorBorder },
  } = theme.useToken();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  const handleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('papertech_darkMode', newMode);
  };

  const userMenuItems = [
    { key: 'profile', label: 'Profile' },
    { key: 'logout', label: 'Logout' },
  ];

  const themeToken = darkMode ? {
    colorPrimary: '#5b52d9',
    colorSuccess: '#6ee7b7',
    colorWarning: '#fbbf24',
    colorError: '#f87171',
    colorText: '#f1f5f9',
    colorTextSecondary: '#cbd5e1',
    colorBgBase: '#0f172a',
    colorBorder: '#334155',
    colorBgContainer: '#1e293b',
    borderRadius: 12,
  } : {
    colorPrimary: '#5b52d9',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorBgBase: '#ffffff',
    colorBorder: '#e2e8f0',
    colorBgContainer: '#ffffff',
    borderRadius: 12,
  };

  return (
    <ConfigProvider theme={{ token: themeToken, algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider theme={darkMode ? 'dark' : 'light'} collapsible trigger={null} style={{ background: darkMode ? '#1e293b' : '#ffffff', borderRight: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
          <div style={{ 
            height: 80, 
            background: darkMode ? '#0f172a' : '#5b52d9', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start', 
            fontWeight: 700, 
            color: '#fff', 
            fontSize: 24, 
            padding: '0 24px',
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.45)' : '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            PAPERTECH
          </div>
          <Sidebar darkMode={darkMode} />
        </Sider>
        <Layout>
          <Header style={{ 
            padding: '0 24px', 
            background: darkMode ? '#1e293b' : '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.45)' : '0 2px 8px rgba(0,0,0,0.1)',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: darkMode ? '#e0e7ff' : '#1e293b' }}>
              Welcome, {user?.full_name || user?.username}
            </div>
            <Space size="large">
              <Button 
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={handleDarkMode}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
                type="text"
                style={{ color: darkMode ? '#cbd5e1' : '#64748b' }}
              >
                {darkMode ? 'Light' : 'Dark'}
              </Button>
              <Dropdown menu={{ items: userMenuItems }}>
                <Button icon={<UserOutlined />} type="text" style={{ color: darkMode ? '#cbd5e1' : '#64748b' }}>{user?.username}</Button>
              </Dropdown>
            </Space>
          </Header>
          <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
            <div style={{ padding: 24, minHeight: 'calc(100vh - 180px)', background: darkMode ? '#0f172a' : '#f8fafc', borderRadius: 12 }}>
              <Routes>
                {user?.role === 'admin' ? (
                  <>
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/customers" element={<CustomerList />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/sales" element={<SalesHistory />} />
                    <Route path="/payments" element={<PaymentList />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/ledger" element={<LedgerView />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/sales" element={<CustomerSalesPage />} />
                    <Route path="*" element={<Navigate to="/sales" replace />} />
                  </>
                )}
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default DashboardLayout;
