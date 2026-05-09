import { useEffect, useState } from 'react';
import { Table, Button, Drawer, Form, Select, InputNumber, Input, message, Typography, Card, Row, Col, Statistic, Space, Spin } from 'antd';
import { PlusOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../../api/axiosConfig';

const formatMoney = value => `Rs. ${Number(value ?? 0).toFixed(2)}`;

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      setPageLoading(true);
      const [paymentsRes, customersRes] = await Promise.all([
        api.get('/payments'), 
        api.get('/customers')
      ]);
      setPayments(paymentsRes.data.data || []);
      setCustomers(customersRes.data.data || []);
    } catch (error) {
      message.error('Failed to load payments');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onFinish = async values => {
    try {
      setLoading(true);
      await api.post('/payments', values);
      message.success('Payment saved successfully');
      setDrawerOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (payments.length === 0) {
      message.warning('No data available to export');
      return;
    }

    const data = payments.map(p => ({
      'Customer': p.shop_name,
      'Amount': formatMoney(p.amount),
      'Method': p.payment_method,
      'Notes': p.notes || '-',
      'Date': new Date(p.created_at).toLocaleDateString('en-US'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `Payments_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('Exported to Excel successfully');
  };

  const exportToPDF = () => {
    if (payments.length === 0) {
      message.warning('No data available to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('📄 PAPERTECH - Payments Report', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')}`, 14, 28);
    
    const tableData = payments.map(p => [
      p.shop_name,
      formatMoney(p.amount),
    ]);

    doc.autoTable({
      head: [['Customer', 'Amount', 'Method', 'Date']],
      body: tableData,
      startY: 35,
      margin: 10,
    });

    doc.save(`Payments_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    message.success('Exported to PDF successfully');
  };

  const columns = [
    { 
      title: 'Customer', 
      dataIndex: 'shop_name', 
      key: 'shop_name',
      render: (text) => <strong>{text}</strong>
    },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (text) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{formatMoney(text)}</span>
    },
    { 
      title: 'Method', 
      dataIndex: 'payment_method', 
      key: 'payment_method' 
    },
    { 
      title: 'Notes', 
      dataIndex: 'notes', 
      key: 'notes' 
    },
    { 
      title: 'Date', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (text) => new Date(text).toLocaleDateString('en-US')
    },
  ];

  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>💰 Payments</Typography.Title>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Payments" 
              value={payments.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Amount" 
              value={totalPayments}
              prefix="Rs. "
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Average Payment" 
              value={payments.length > 0 ? (totalPayments / payments.length).toFixed(2) : 0}
              prefix="Rs. "
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Record New Payment
          </Button>
          <Button 
            icon={<FileExcelOutlined />} 
            onClick={exportToExcel}
            style={{ background: '#10b981', color: '#fff', border: 'none' }}
          >
            Excel Export
          </Button>
          <Button 
            icon={<FilePdfOutlined />} 
            danger
            onClick={exportToPDF}
          >
            PDF Export
          </Button>
        </Space>
      </Card>

      {/* Payments Table */}
      <Card>
        <Spin spinning={pageLoading}>
          <Table 
            rowKey="id" 
            columns={columns} 
            dataSource={payments.map((p, idx) => ({ ...p, key: p.id || idx }))}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            bordered
          />
        </Spin>
      </Card>

      {/* New Payment Drawer */}
      <Drawer 
        title="💰 Record New Payment" 
        open={drawerOpen} 
        width={450}
        onClose={() => setDrawerOpen(false)}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form 
          layout="vertical" 
          form={form} 
          onFinish={onFinish}
        >
          <Form.Item 
            name="customer_id" 
            label="Select Customer" 
            rules={[{ required: true, message: 'Please select a customer' }]}
          > 
            <Select 
              placeholder="Search by customer name"
              options={customers.map(c => ({ 
                label: `${c.shop_name} (${c.full_name})`, 
                value: c.id 
              }))} 
            />
          </Form.Item>

          <Form.Item 
            name="amount" 
            label="Amount" 
            rules={[{ required: true, type: 'number', min: 1, message: 'Please enter amount' }]}
          > 
            <InputNumber 
              style={{ width: '100%' }}
              size="large"
              prefix="Rs. "
              placeholder="Example: 5000"
            />
          </Form.Item>

          <Form.Item 
            name="payment_method" 
            label="Payment Method" 
            initialValue="cash"
            rules={[{ required: true }]}
          > 
            <Select 
              options={[
                { label: 'Cash', value: 'cash' },
                { label: 'Check', value: 'check' },
                { label: 'Bank Transfer', value: 'bank_transfer' },
                { label: 'Online', value: 'online' },
              ]}
              size="large"
            />
          </Form.Item>

          <Form.Item 
            name="notes" 
            label="Notes"
          > 
            <Input.TextArea 
              rows={3} 
              placeholder="Add any notes or comments" 
            />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button 
              onClick={() => {
                setDrawerOpen(false);
                form.resetFields();
              }}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
            >
              Record Payment
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}

export default PaymentList;
