import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Input, message, Typography, Card, Row, Col, Statistic, Space, Spin, Popconfirm, DatePicker, Tooltip } from 'antd';
import { PlusOutlined, FileExcelOutlined, FilePdfOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/apiClient';

const formatMoney = value => `Rs. ${Number(value ?? 0).toFixed(2)}`;
const { RangePicker } = DatePicker;

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  const fetchData = async (nextFilters = filters) => {
    try {
      setPageLoading(true);
      const params = { ...nextFilters };
      const [paymentsRes, customersRes] = await Promise.all([
        api.get('/payments', { params }),
        api.get('/customers')
      ]);
      setPayments(paymentsRes.data.data || []);
      setCustomers(customersRes.data.data || []);
    } catch (error) {
      message.error('Failed to load paymentsssss');
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
      const payload = {
        ...values,
        amount: Number(values.amount || 0),
      };
      if (editingPayment) {
        await api.put(`/payments/${editingPayment.id}`, payload);
        message.success('Payment updated successfully');
      } else {
        await api.post('/payments', payload);
        message.success('Payment saved successfully');
      }
      setDrawerOpen(false);
      setEditingPayment(null);
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
    doc.text('TRADESTACK - Payments Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')}`, 14, 28);

    const tableData = payments.map(p => [
      p.shop_name,
      formatMoney(p.amount),
      p.payment_method,
      new Date(p.created_at).toLocaleDateString('en-US'),
    ]);

    autoTable(doc, {
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
    {
      title: 'Action',
      key: 'action',
      width: 96,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit payment">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditingPayment(record);
                form.setFieldsValue({
                  customer_id: record.customer_id,
                  amount: Number(record.amount || 0),
                  payment_method: record.payment_method || 'cash',
                  notes: record.notes,
                });
                setDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this payment?"
            okText="Delete"
            cancelText="Cancel"
            onConfirm={async () => {
              try {
                await api.delete(`/payments/${record.id}`);
                message.success('Payment deleted successfully');
                fetchData();
              } catch (error) {
                message.error(error.response?.data?.message || 'Failed to delete payment');
              }
            }}
          >
            <Tooltip title="Delete payment">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>Payments</Typography.Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Payments"
              value={payments.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Amount"
              value={totalPayments}
              prefix="Rs. "
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
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

      <Card style={{ marginBottom: 24 }}>
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={(values) => {
            const nextFilters = {
              customer_id: values.customer_id,
              from_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
              to_date: values.date_range?.[1]?.format('YYYY-MM-DD'),
            };
            setFilters(nextFilters);
            fetchData(nextFilters);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, justifyContent: 'space-evenly', flexWrap: 'nowrap' }}>
            <div style={{ flex: '1 1 260px' }}>
              <Form.Item name="customer_id" label="Customer" style={{ marginBottom: 0 }}>
                <Select
                  allowClear
                  showSearch
                  placeholder="Filter by customer name"
                  optionFilterProp="label"
                  options={customers.map(c => ({
                    label: `${c.shop_name} (${c.full_name})`,
                    value: c.id
                  }))}
                />
              </Form.Item>
            </div>
            <div style={{ flex: '1 1 260px' }}>
              <Form.Item name="date_range" label="Date Range" style={{ marginBottom: 0 }}>
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <Space wrap={false}>
                <Tooltip title="Apply selected payment filters">
                  <Button type="primary" htmlType="submit">
                    Apply
                  </Button>
                </Tooltip>
                <Tooltip title="Clear payment filters">
                  <Button
                    onClick={() => {
                      filterForm.resetFields();
                      setFilters({});
                      fetchData({});
                    }}
                  >
                    Reset
                  </Button>
                </Tooltip>
              </Space>
            </div>
          </div>
        </Form>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Tooltip title="Record a new customer payment">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingPayment(null);
                form.resetFields();
                setDrawerOpen(true);
              }}
            >
              Record New Payment
            </Button>
          </Tooltip>
          <Tooltip title="Export visible payments to Excel">
            <Button
              icon={<FileExcelOutlined />}
              onClick={exportToExcel}
              type="primary"
            >
              Excel Export
            </Button>
          </Tooltip>
          <Tooltip title="Export visible payments to PDF">
            <Button
              icon={<FilePdfOutlined />}
              danger
              onClick={exportToPDF}
            >
              PDF Export
            </Button>
          </Tooltip>
        </Space>
      </Card>

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

      <Modal
        title={editingPayment ? "Edit Payment" : "Record New Payment"}
        open={drawerOpen}
        onCancel={() => {
          setDrawerOpen(false);
          setEditingPayment(null);
          form.resetFields();
        }}
        centered
        width={560}
        styles={{
          footer: {
            padding: "16px 24px",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "right",
            gap: "12px",
          },
          body: {
            padding: "16px 24px 8px",
          },
        }}
        footer={
          <>
            <Button
              onClick={() => {
                setDrawerOpen(false);
                setEditingPayment(null);
                form.resetFields();
              }}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              size="large"
              onClick={() => form.submit()}
            >
              {editingPayment ? "Update Payment" : "Record Payment"}
            </Button>
          </>
        }
      >
        <Form layout="vertical" form={form} onFinish={onFinish} autoComplete="off" style={{ marginTop: "8px" }}>
          <Form.Item
            name="customer_id"
            label="Select Customer"
            rules={[{ required: true, message: "Please select a customer" }]}
          >
            <Select
              showSearch
              size="large"
              placeholder="Search by customer name"
              optionFilterProp="label"
              options={customers.map((c) => ({
                label: `${c.shop_name} (${c.full_name})`,
                value: c.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, type: "number", min: 1, message: "Please enter amount" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  size="large"
                  min={1}
                  prefix="Rs. "
                  placeholder="e.g.: 5000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="payment_method"
                label="Payment Method"
                initialValue="cash"
                rules={[{ required: true, message: "Select payment method" }]}
              >
                <Select
                  size="large"
                  placeholder="Select method"
                  options={[
                    { label: "Cash", value: "cash" },
                    { label: "Check", value: "check" },
                    { label: "Bank Transfer", value: "bank_transfer" },
                    { label: "Online", value: "online" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Add any notes or comments" style={{ resize: "none" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PaymentList;
