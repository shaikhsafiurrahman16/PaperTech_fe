import { Badge, Menu } from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  DollarOutlined,
  BarChartOutlined,
  LogoutOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Sidebar({ darkMode, onLogoutRequest, chatUnreadTotal = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);

  const superAdminMenuItems = [
    { key: '/companies', icon: <ApartmentOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Companies' },
  ];

  const adminMenuItems = [
    { key: '/dashboard', icon: <ShoppingOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Dashboard' },
    { key: '/customers', icon: <UserOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Customers' },
    { key: '/vendors', icon: <TeamOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Vendors' },
    { key: '/purchases', icon: <ShoppingCartOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Purchases' },
    { key: '/products', icon: <ShoppingOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Products' },
    { key: '/sales', icon: <FileTextOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Sales' },
    { key: '/invoices', icon: <FileTextOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Invoices' },
    { key: '/payments', icon: <DollarOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Payments' },
    { key: '/reports', icon: <BarChartOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'Reports' },
    {
      key: '/chat',
      icon: <MessageOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />,
      label: (
        <Badge dot={chatUnreadTotal > 0} offset={[6, 0]}>
          <span>Chat Support</span>
        </Badge>
      ),
    },
  ];

  const customerMenuItems = [
    { key: '/sales', icon: <FileTextOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'My Purchases' },
    { key: '/invoices', icon: <FileTextOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'My Invoices' },
    {
      key: '/chat',
      icon: <MessageOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />,
      label: (
        <Badge dot={chatUnreadTotal > 0} offset={[6, 0]}>
          <span>Chat Support</span>
        </Badge>
      ),
    },
  ];

  const vendorMenuItems = [
    { key: '/purchases', icon: <ShoppingCartOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'My Purchases' },
    { key: '/invoices', icon: <FileTextOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />, label: 'My Invoices' },
    {
      key: '/chat',
      icon: <MessageOutlined style={{ color: darkMode ? '#cbd5e1' : '#1890ff' }} />,
      label: (
        <Badge dot={chatUnreadTotal > 0} offset={[6, 0]}>
          <span>Chat Support</span>
        </Badge>
      ),
    },
  ];

  const menuItems = user?.role === 'super_admin'
    ? superAdminMenuItems
    : user?.role === 'admin'
    ? adminMenuItems
    : user?.role === 'vendor'
      ? vendorMenuItems
      : customerMenuItems;

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
