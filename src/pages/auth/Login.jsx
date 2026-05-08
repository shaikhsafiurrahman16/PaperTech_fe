import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Tabs, ConfigProvider, theme } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../api/axiosConfig';
import { loginSuccess } from '../../store/authSlice';

const { Title, Text } = Typography;

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('papertech_darkMode') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const onFinish = async values => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', values);
      dispatch(loginSuccess({ token: response.data.data.token, user: response.data.data }));
      message.success(activeTab === 'admin' ? 'Admin Login Successful' : 'Customer Login Successful');
      navigate('/dashboard');
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const adminTabContent = (
    <Form name="admin-login" layout="vertical" onFinish={onFinish}>
      <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please enter your username' }]}> 
        <Input 
          placeholder="Enter your username" 
          size="large"
          prefix={<UserOutlined />}
        />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}> 
        <Input.Password 
          placeholder="Enter your password" 
          size="large"
          prefix={<LockOutlined />}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading} size="large">
          Sign In as Admin
        </Button>
      </Form.Item>
    </Form>
  );

  const customerTabContent = (
    <Form name="customer-login" layout="vertical" onFinish={onFinish}>
      <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please enter your username' }]}> 
        <Input 
          placeholder="Enter your username" 
          size="large"
          prefix={<UserOutlined />}
        />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}> 
        <Input.Password 
          placeholder="Enter your password" 
          size="large"
          prefix={<LockOutlined />}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading} size="large">
          Sign In as Customer
        </Button>
      </Form.Item>
    </Form>
  );

  const themeConfig = {
    token: {
      colorPrimary: '#5b52d9',
      colorBgBase: darkMode ? '#0f172a' : '#ffffff',
      colorTextBase: darkMode ? '#f1f5f9' : '#1e293b',
      colorBorder: darkMode ? '#334155' : '#e2e8f0',
      borderRadius: 12,
      fontSizeHeading1: 32,
      fontSizeHeading2: 28,
    },
    algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: darkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <Card style={{ 
          width: '100%',
          maxWidth: 500, 
          borderRadius: 16,
          boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.3)',
          border: darkMode ? '1px solid #334155' : 'none',
          backgroundColor: darkMode ? '#1e293b' : '#ffffff'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
            <Title level={2} style={{ 
              margin: 0, 
              color: darkMode ? '#e0e7ff' : '#5b52d9',
              letterSpacing: '2px',
              fontWeight: 700
            }}>
              PAPERTECH
            </Title>
            <Text style={{ fontSize: 13, marginTop: 12, display: 'block', color: darkMode ? '#cbd5e1' : '#64748b' }}>
              Paper & Supplies Management System
            </Text>
          </div>

          {/* Login Tabs */}
          <Tabs 
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'admin',
                label: 'Admin Login',
                children: adminTabContent,
              },
              {
                key: 'customer',
                label: 'Customer Login',
                children: customerTabContent,
              },
            ]}
          />

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24, borderTop: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', paddingTop: 16 }}>
            <Text style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#78716c' }}>
              © 2026 PaperTech Solutions. All rights reserved.
            </Text>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}

export default Login;
