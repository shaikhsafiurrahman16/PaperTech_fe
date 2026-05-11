import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, message, Spin, Space, Button } from 'antd';
import { ArrowUpOutlined, ShoppingOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../../api/axiosConfig';

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        const response = await api.get('/reports/dashboard');
        setSummary(response.data.data);
      } catch (error) {
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  const stats = summary ? [
    {
      title: 'Total Sales',
      value: summary.total_sales || 0,
      icon: <ShoppingOutlined />,
      color: '#1890ff',
      bgColor: '#e6f7ff'
    },
    {
      title: 'Total Customers',
      value: summary.total_customers || 0,
      icon: <UserOutlined />,
      color: '#52c41a',
      bgColor: '#f6ffed'
    },
    {
      title: 'Current Stock',
      value: summary.total_stock || 0,
      icon: <ShoppingOutlined />,
      color: '#faad14',
      bgColor: '#fffbe6'
    },
    {
      title: 'Pending Payments',
      value: summary.total_pending_payments || 0,
      icon: <ArrowUpOutlined />,
      color: '#ff4d4f',
      bgColor: '#fff2e8'
    }
  ] : [];

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ marginBottom: 32 }}>
          <Typography.Title level={2}>Dashboard</Typography.Title>
          <Typography.Text type="secondary" style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>
            Your Business Analytics Dashboard
          </Typography.Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                style={{
                  background: isDarkMode ? '#111827' : stat.bgColor,
                  border: 'none',
                  borderRadius: '8px',
                  color: isDarkMode ? '#e2e8f0' : undefined,
                }}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    valueStyle={{ color: stat.color, fontWeight: 'bold' }}
                  />
                  <div style={{ fontSize: 32, color: stat.color, opacity: 0.3 }}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Low Stock Alerts */}
        {summary?.low_stock_alerts > 0 && (
          <Card
            style={{
              marginBottom: 24,
              background: isDarkMode ? '#111827' : '#fff2f0',
              borderLeft: `4px solid ${isDarkMode ? '#fb7185' : '#ff4d4f'}`,
              color: isDarkMode ? '#e2e8f0' : undefined,
            }}
          >
            <Row>
              <Col span={2} style={{ fontSize: 24 }}>
                <WarningOutlined style={{ color: '#ff4d4f' }} />
              </Col>
              <Col span={22}>
                <Typography.Text strong style={{ color: '#ff4d4f' }}>
                  {summary.low_stock_alerts} products have low stock
                </Typography.Text>
              </Col>
            </Row>
          </Card>
        )}

        {/* Quick Summary Table */}
        <Card title="📋 Quick Summary" style={{ borderRadius: '8px', background: isDarkMode ? '#111827' : undefined }}>
          <Table
            style={{ background: isDarkMode ? '#0f172a' : undefined }}
            columns={[
              { title: 'Metric', dataIndex: 'label', key: 'label', width: '50%' },
              {
                title: 'Value',
                dataIndex: 'value',
                key: 'value',
                render: (text) => <strong>{text}</strong>
              },
            ]}
            dataSource={[
              { key: '1', label: 'Total Sales', value: summary?.total_sales || 0 },
              { key: '2', label: 'Total Customers', value: summary?.total_customers || 0 },
              { key: '3', label: 'Total Stock Units', value: summary?.total_stock || 0 },
              { key: '4', label: 'Pending Payments', value: summary?.total_pending_payments || 0 },
              { key: '5', label: 'Low Stock Alerts', value: summary?.low_stock_alerts || 0 },
            ]}
            pagination={false}
            bordered
          />
        </Card>
      </div>
    </Spin>
  );
}

export default AdminDashboard;
