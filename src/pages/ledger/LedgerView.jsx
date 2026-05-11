import { useEffect, useState } from 'react';
import { Select, Table, Card, Typography, message, Row, Col, Statistic, Spin, Empty, Tag } from 'antd';
import api from '../../api/axiosConfig';

const formatMoney = value => `Rs. ${Number(value ?? 0).toFixed(2)}`;

function LedgerView() {
  const [customers, setCustomers] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const response = await api.get('/customers');
        setCustomers(response.data.data || []);
      } catch (error) {
        message.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const onCustomerChange = async id => {
    try {
      setLoading(true);
      setSelectedCustomer(id);
      const response = await api.get(`/ledger/${id}`);
      setLedger(response.data.data?.ledger || []);
    } catch (error) {
      message.error('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleDateString('en-US')
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      render: (type) => {
        const colors = {
          'sale': '#2db7f5',
          'payment': '#52c41a',
          'adjustment': '#ff9c6e',
        };
        return (
          <Tag color={colors[type] || '#999'}>
            {type === 'sale' ? 'Sale' : type === 'payment' ? 'Payment' : 'Adjustment'}
          </Tag>
        );
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => formatMoney(text)
    },
    {
      title: 'Previous Balance',
      dataIndex: 'previous_balance',
      key: 'previous_balance',
      render: (text) => formatMoney(text)
    },
    {
      title: 'Current Balance',
      dataIndex: 'current_balance',
      key: 'current_balance',
      render: (text) => <strong style={{ color: text > 0 ? '#ff4d4f' : '#52c41a' }}>{formatMoney(text)}</strong>
    },
    {
      title: 'Notes',
      dataIndex: 'remarks',
      key: 'remarks'
    },
  ];

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const currentBalance = selectedCustomerData?.current_balance || 0;
  const creditLimit = selectedCustomerData?.credit_limit || 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>Customer Ledger</Typography.Title>
      </div>

      {/* Customer Selection */}
      <Card style={{ marginBottom: 24 }}>
        <Select
          placeholder="Select a customer"
          style={{ width: '100%' }}
          size="large"
          options={customers.map(c => ({
            label: `${c.shop_name} - ${c.full_name}`,
            value: c.id
          }))}
          onChange={onCustomerChange}
        />
      </Card>

      {/* Customer Statistics */}
      {selectedCustomer && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Credit Limit"
                value={creditLimit}
                prefix="Rs. "
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Current Balance"
                value={currentBalance}
                prefix="Rs. "
                valueStyle={{ color: currentBalance > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Available Credit"
                value={Math.max(0, creditLimit - currentBalance)}
                prefix="Rs. "
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Ledger Table */}
      {selectedCustomer && (
        <Card title="Ledger Entries">
          <Spin spinning={loading}>
            {ledger.length === 0 ? (
              <Empty description="No ledger entries found" />
            ) : (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={ledger.map((l, idx) => ({ ...l, key: l.id || idx }))}
                pagination={{ pageSize: 15, showSizeChanger: true }}
                scroll={{ x: 1000 }}
                bordered
              />
            )}
          </Spin>
        </Card>
      )}

      {!selectedCustomer && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <Empty
            description="Please select a customer"
          />
        </Card>
      )}
    </div>
  );
}

export default LedgerView;
