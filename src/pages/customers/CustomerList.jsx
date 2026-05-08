import { useEffect, useState } from 'react';
import { Table, Button, Drawer, Form, Input, InputNumber, message, Typography, Card, Row, Col, Statistic, Select, Space, Spin } from 'antd';
import { PlusOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../../api/axiosConfig';

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchCustomers = async () => {
    try {
      setPageLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data.data || []);
    } catch (error) {
      message.error('Failed to load customers');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onFinish = async values => {
    try {
      setLoading(true);
      await api.post('/customers', values);
      message.success('Customer saved successfully');
      setDrawerOpen(false);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (customers.length === 0) {
      message.warning('No data available to export');
      return;
    }

    const data = customers.map(c => ({
      'Shop Name': c.shop_name,
      'Owner Name': c.full_name,
      'Phone': c.phone,
      'Address': c.address || '-',
      'CNIC': c.cnic || '-',
      'Credit Limit': `Rs. ${c.credit_limit?.toFixed(2) || 0}`,
      'Current Balance': `Rs. ${c.current_balance?.toFixed(2) || 0}`,
      'قسم': c.customer_type === 'star' ? 'Star' : 'Local',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `Customers_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('Exported to Excel successfully');
  };

  const exportToPDF = () => {
    if (customers.length === 0) {
      message.warning('کوئی ڈیٹا export کرنے کے لیے دستیاب نہیں');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('📄 PAPERTECH - Customers Report', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Report Date: ${new Date().toLocaleDateString('ur-PK')}`, 14, 28);
    
    const tableData = customers.map(c => [
      c.shop_name,
      c.full_name,
      c.phone,
      `Rs. ${c.credit_limit?.toFixed(2) || 0}`,
      `Rs. ${c.current_balance?.toFixed(2) || 0}`,
      c.customer_type === 'star' ? 'Star' : 'Local',
    ]);

    doc.autoTable({
      head: [['Shop Name', 'Full Name', 'Phone', 'Credit Limit', 'Balance', 'Type']],
      body: tableData,
      startY: 35,
      margin: 10,
    });

    doc.save(`Customers_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    message.success('Exported to PDF successfully');
  };

  const columns = [
    { 
      title: 'Shop', 
      dataIndex: 'shop_name', 
      key: 'shop_name',
      render: (text) => <strong>{text}</strong>
    },
    { 
      title: 'Name', 
      dataIndex: 'full_name', 
      key: 'full_name' 
    },
    { 
      title: 'Phone', 
      dataIndex: 'phone', 
      key: 'phone' 
    },
    { 
      title: 'Credit Limit', 
      dataIndex: 'credit_limit', 
      key: 'credit_limit',
      render: (text) => `Rs. ${text?.toFixed(2) || 0}`
    },
    { 
      title: 'Current Balance', 
      dataIndex: 'current_balance', 
      key: 'current_balance',
      render: (text) => <span style={{ color: text > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>Rs. {text?.toFixed(2) || 0}</span>
    },
    {
      title: 'Type',
      dataIndex: 'customer_type',
      key: 'customer_type',
      render: (type) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          background: type === 'star' ? '#fff1f0' : '#f5f5f5',
          color: type === 'star' ? '#ff4d4f' : '#666'
        }}>
          {type === 'star' ? '⭐ Star' : 'Local'}
        </span>
      )
    }
  ];

  const starCustomers = customers.filter(c => c.customer_type === 'star').length;
  const totalCredit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
  const totalBalance = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>👥 Customers Management</Typography.Title>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Customers" 
              value={customers.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Star Customers" 
              value={starCustomers}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Credit" 
              value={totalCredit}
              prefix="Rs. "
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Balance" 
              value={totalBalance}
              prefix="Rs. "
              valueStyle={{ color: totalBalance > 0 ? '#ff4d4f' : '#52c41a' }}
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
            نیا Customer شامل کریں
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

      {/* Customers Table */}
      <Card>
        <Spin spinning={pageLoading}>
          <Table 
            rowKey="id" 
            columns={columns} 
            dataSource={customers.map((c, idx) => ({ ...c, key: c.id || idx }))}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            bordered
          />
        </Spin>
      </Card>

      {/* Create Customer Drawer */}
      <Drawer 
        title="👥 نیا Customer شامل کریں" 
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
            name="full_name" 
            label="مالک کا مکمل نام" 
            rules={[{ required: true, message: 'نام ضروری ہے' }]}
          > 
            <Input placeholder="مثال: احمد علی" size="large" />
          </Form.Item>

          <Form.Item 
            name="shop_name" 
            label="دکان کا نام" 
            rules={[{ required: true, message: 'دکان کا نام ضروری ہے' }]}
          > 
            <Input placeholder="مثال: احمد پیپر ہاؤس" size="large" />
          </Form.Item>

          <Form.Item 
            name="phone" 
            label="فون نمبر" 
            rules={[{ required: true, message: 'فون ضروری ہے' }]}
          > 
            <Input placeholder="مثال: 03001234567" size="large" />
          </Form.Item>

          <Form.Item 
            name="address" 
            label="پتہ"
          > 
            <Input.TextArea rows={2} placeholder="دکان کا مکمل پتہ" />
          </Form.Item>

          <Form.Item 
            name="cnic" 
            label="CNIC"
          > 
            <Input placeholder="مثال: 12345-1234567-1" />
          </Form.Item>

          <Form.Item 
            name="credit_limit" 
            label="کریڈٹ حد" 
            rules={[{ type: 'number', min: 0, message: 'درست نمبر درج کریں' }]}
          >
            <InputNumber 
              placeholder="مثال: 50000" 
              style={{ width: '100%' }}
              size="large"
              prefix="Rs. "
            />
          </Form.Item>

          <Form.Item 
            name="username" 
            label="Username (Login کے لیے)" 
            rules={[{ required: true, message: 'Username ضروری ہے' }]}
          > 
            <Input placeholder="مثال: ahmad_shop" size="large" />
          </Form.Item>

          <Form.Item 
            name="password" 
            label="Password" 
            rules={[{ required: true, message: 'Password ضروری ہے' }, { min: 6, message: 'کم از کم 6 حروف' }]}
          > 
            <Input.Password placeholder="محفوظ password" size="large" />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button 
              onClick={() => {
                setDrawerOpen(false);
                form.resetFields();
              }}
              size="large"
            >
              منسوخ
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
            >
              محفوظ کریں
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}

export default CustomerList;
