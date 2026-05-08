import { useEffect, useState } from 'react';
import { Table, Button, Drawer, Form, Select, InputNumber, Row, Col, Space, message, Typography, Card, Statistic, Spin, Tag } from 'antd';
import { MinusCircleOutlined, PlusOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import api from '../../api/axiosConfig';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [pageLoading, setPageLoading] = useState(false);

  const fetchData = async () => {
    try {
      setPageLoading(true);
      const [salesRes, customersRes, productsRes] = await Promise.all([
        api.get('/sales'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setSales(salesRes.data.data || []);
      setCustomers(customersRes.data.data || []);
      setProducts(productsRes.data.data || []);
    } catch (error) {
      message.error('Failed to load data');
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
      await api.post('/sales', values);
      message.success('Sale saved successfully');
      setDrawerOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'ناکام');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (sales.length === 0) {
      message.warning('کوئی ڈیٹا export کرنے کے لیے دستیاب نہیں');
      return;
    }

    const data = sales.map(sale => ({
      'Invoice #': sale.invoice_number,
      'Customer': sale.shop_name,
      'کل رقم': sale.total_amount,
      'ڈسکاؤنٹ': sale.discount,
      'حتمی رقم': sale.grand_total,
      'ادائیگی': sale.payment_received,
      'بقایا': sale.remaining_balance,
      'قسم': sale.sale_type,
      'تاریخ': new Date(sale.created_at).toLocaleDateString('ur-PK'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('Excel میں export ہو گیا');
  };

  const exportToPDF = () => {
    if (sales.length === 0) {
      message.warning('کوئی ڈیٹا export کرنے کے لیے دستیاب نہیں');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('📄 PAPERTECH - Sales Report', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Report Date: ${new Date().toLocaleDateString('ur-PK')}`, 14, 28);
    
    const tableData = sales.map(sale => [
      sale.invoice_number,
      sale.shop_name,
      `Rs. ${sale.total_amount?.toFixed(2) || 0}`,
      `Rs. ${sale.discount?.toFixed(2) || 0}`,
      `Rs. ${sale.grand_total?.toFixed(2) || 0}`,
      sale.sale_type,
      new Date(sale.created_at).toLocaleDateString('ur-PK'),
    ]);

    doc.autoTable({
      head: [['Invoice', 'Customer', 'Total', 'Discount', 'Grand Total', 'Type', 'Date']],
      body: tableData,
      startY: 35,
      margin: 10,
    });

    doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    message.success('PDF میں export ہو گیا');
  };

  const columns = [
    { 
      title: 'Invoice #', 
      dataIndex: 'invoice_number', 
      key: 'invoice_number',
      render: (text) => <strong>{text}</strong>
    },
    { 
      title: 'Customer', 
      dataIndex: 'shop_name', 
      key: 'shop_name' 
    },
    { 
      title: 'Total', 
      dataIndex: 'grand_total', 
      key: 'grand_total',
      render: (text) => `Rs. ${text?.toFixed(2) || 0}`
    },
    { 
      title: 'Paid', 
      dataIndex: 'payment_received', 
      key: 'payment_received',
      render: (text) => `Rs. ${text?.toFixed(2) || 0}`
    },
    { 
      title: 'Balance', 
      dataIndex: 'remaining_balance', 
      key: 'remaining_balance',
      render: (text) => <span style={{ color: text > 0 ? '#ff4d4f' : '#52c41a' }}>Rs. {text?.toFixed(2) || 0}</span>
    },
    { 
      title: 'Type', 
      dataIndex: 'sale_type', 
      key: 'sale_type',
      render: (text) => (
        <Tag color={text === 'cash' ? '#f50' : '#2db7f5'}>
          {text === 'cash' ? 'نقد' : 'ادھار'}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleDateString('ur-PK')
    }
  ];

  const totalSales = sales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
  const totalBalance = sales.reduce((sum, s) => sum + (s.remaining_balance || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>📊 Sales History</Typography.Title>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="کل Sales" 
              value={sales.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="کل رقم" 
              value={totalSales}
              prefix="Rs. "
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="کل بقایا" 
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            نیا Sale بنائیں
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={exportToExcel} style={{ background: '#10b981', color: '#fff', border: 'none' }}>
            Excel Export
          </Button>
          <Button icon={<FilePdfOutlined />} danger onClick={exportToPDF}>
            PDF Export
          </Button>
        </Space>
      </Card>

      {/* Sales Table */}
      <Card>
        <Spin spinning={pageLoading}>
          <Table 
            rowKey="id" 
            columns={columns} 
            dataSource={sales.map((sale, idx) => ({ ...sale, key: sale.id || idx }))}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            bordered
          />
        </Spin>
      </Card>

      {/* Create Sale Drawer */}
      <Drawer 
        title="نیا Sale بنائیں" 
        open={drawerOpen} 
        width={720} 
        onClose={() => setDrawerOpen(false)}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item 
            name="customer_id" 
            label="Customer منتخب کریں" 
            rules={[{ required: true, message: 'Customer منتخب کریں' }]}
          > 
            <Select 
              placeholder="Customer کے نام سے تلاش کریں"
              options={customers.map(c => ({ 
                label: `${c.shop_name} (${c.full_name})`, 
                value: c.id 
              }))} 
            />
          </Form.Item>

          <Typography.Title level={5}>Items شامل کریں</Typography.Title>
          <Form.List 
            name="items" 
            initialValue={[{ product_id: null, quantity: 1, unit_price: 0 }]}
          > 
            {(fields, { add, remove }) => (
              <>
                {fields.map(field => (
                  <Card key={field.key} style={{ marginBottom: 12 }}>
                    <Row gutter={16} align="middle">
                      <Col span={10}>
                        <Form.Item 
                          {...field} 
                          name={[field.name, 'product_id']} 
                          fieldKey={[field.fieldKey, 'product_id']} 
                          label="Product" 
                          rules={[{ required: true, message: 'Product منتخب کریں' }]}
                          style={{ marginBottom: 0 }}
                        > 
                          <Select 
                            placeholder="Product منتخب کریں"
                            options={products.map(p => ({ 
                              label: `${p.name} (Stock: ${p.current_stock})`, 
                              value: p.id 
                            }))} 
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item 
                          {...field} 
                          name={[field.name, 'quantity']} 
                          fieldKey={[field.fieldKey, 'quantity']} 
                          label="مقدار" 
                          rules={[{ required: true, type: 'number', min: 1, message: 'مقدار درج کریں' }]}
                          style={{ marginBottom: 0 }}
                        > 
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item 
                          {...field} 
                          name={[field.name, 'unit_price']} 
                          fieldKey={[field.fieldKey, 'unit_price']} 
                          label="قیمت" 
                          rules={[{ required: true, type: 'number', min: 0, message: 'قیمت درج کریں' }]}
                          style={{ marginBottom: 0 }}
                        > 
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button 
                          type="text" 
                          danger 
                          icon={<MinusCircleOutlined />} 
                          onClick={() => remove(field.name)} 
                          style={{ marginTop: 8 }}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button 
                    type="dashed" 
                    block 
                    icon={<PlusOutlined />} 
                    onClick={() => add()}
                  >
                    Item شامل کریں
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="discount" label="ڈسکاؤنٹ" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_received" label="ادائیگی موصول" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
              >
                Sale محفوظ کریں
              </Button>
              <Button 
                onClick={() => {
                  setDrawerOpen(false);
                  form.resetFields();
                }}
                size="large"
              >
                منسوخ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default SalesHistory;
