import { Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  DollarOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Sidebar({ darkMode, onLogoutRequest }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);

  const adminMenuItems = [
    { key: '/dashboard', icon: <DashboardOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Dashboard' },
    { key: '/customers', icon: <UserOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Customers' },
    { key: '/products', icon: <ShoppingOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Products' },
    { key: '/sales', icon: <FileTextOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Sales' },
    { key: '/invoices', icon: <FileTextOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Invoices' },
    { key: '/payments', icon: <DollarOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Payments' },
    { key: '/reports', icon: <BarChartOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Reports' },
  ];

  const customerMenuItems = [
    { key: '/sales', icon: <FileTextOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'My Purchases' },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : customerMenuItems;

  const onMenuClick = ({ key }) => {
    if (key === 'logout') {
      onLogoutRequest?.();
      return;
    }
    navigate(key);
  };

  return (
    <Menu
      theme={darkMode ? 'dark' : 'light'}
      mode="inline"
      selectedKeys={[location.pathname]}
      onClick={onMenuClick}
      style={{
        background: darkMode ? '#1e293b' : '#ffffff',
        borderRight: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
      }}
      items={[
        ...menuItems,
        { key: 'logout', icon: <LogoutOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Logout' }
      ]}
    />
  );
}

export default Sidebar;
