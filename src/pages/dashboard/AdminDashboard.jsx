import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, message, Spin, theme } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import api from '../../api/axiosConfig';

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    token: { colorBgContainer, colorError, colorErrorBg, colorTextSecondary },
  } = theme.useToken();

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
      color: '#1890ff',
    },
    {
      title: 'Total Customers',
      value: summary.total_customers || 0,
      color: '#52c41a',
    },
    {
      title: 'Current Stock',
      value: summary.total_stock || 0,
      color: '#faad14',
    },
    {
      title: 'Pending Payments',
      value: summary.total_pending_payments || 0,
      color: '#ff4d4f',
    }
  ] : [];

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={2}>Dashboard</Typography.Title>
          <Typography.Text type="secondary" style={{ color: colorTextSecondary }}>
            Your Business Analytics Dashboard
          </Typography.Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Low Stock Alerts */}
        {summary?.low_stock_alerts > 0 && (
          <Card
            style={{
              marginBottom: 24,
              background: colorErrorBg,
              borderLeft: `4px solid ${colorError}`,
            }}
          >
            <Row>
              <Col span={2} style={{ fontSize: 24 }}>
                <WarningOutlined style={{ color: colorError }} />
              </Col>
              <Col span={22}>
                <Typography.Text strong style={{ color: colorError }}>
                  {summary.low_stock_alerts} products have low stock
                </Typography.Text>
              </Col>
            </Row>
          </Card>
        )}

        {/* Quick Summary Table */}
        <Card title="Quick Summary" style={{ background: colorBgContainer }}>
          <Table
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
