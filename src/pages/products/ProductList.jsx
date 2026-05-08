import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Typography, Space, Tag, Row, Col, Card, Statistic, Spin, Tooltip, Drawer } from 'antd';
import { PlusOutlined, DeleteOutlined, FileExcelOutlined, FilePdfOutlined, EditOutlined, DatabaseOutlined } from '@ant-design/icons';
import api from '../../api/axiosConfig';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockDrawerOpen, setStockDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onFinish = async values => {
    try {
      setLoading(true);
      await api.post('/products', values);
      message.success('Product saved successfully');
      setModalOpen(false);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      message.error(error.response?.data?.message || 'ناکام');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId, quantity) => {
    try {
      await api.patch(`/products/${productId}/stock`, { quantity_change: quantity });
      message.success('Stock updated successfully');
      setStockDrawerOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      message.error('Failed to update stock');
    }
  };

  const handleDeleteProduct = async (productId) => {
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure?',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`/products/${productId}`);
          message.success('Product deleted successfully');
          fetchProducts();
        } catch (error) {
          message.error('Failed to delete product');
        }
      },
    });
  };

  const exportToExcel = () => {
    const data = products.map(p => ({
      'Name': p.name,
      'Type': p.product_type,
      'Unit': p.unit_type,
      'Cost Price': `Rs. ${p.cost_price}`,
      'Sale Price': `Rs. ${p.sale_price}`,
      'Current Stock': p.current_stock,
      'Min Stock Alert': p.min_stock_alert,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'products.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Products Inventory Report', 14, 15);
    
    const tableData = products.map(p => [
      p.name,
      p.product_type,
      p.sale_price,
      p.current_stock,
      p.min_stock_alert,
    ]);

    doc.autoTable({
      head: [['Name', 'Type', 'Sale Price', 'Stock', 'Alert']],
      body: tableData,
      startY: 25,
    });

    doc.save('products.pdf');
  };

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock_alert);

  const columns = [
    { 
      title: 'Name', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => (
        <Tooltip title={record.description}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    { title: 'Type', dataIndex: 'product_type', key: 'product_type' },
    { title: 'Unit', dataIndex: 'unit_type', key: 'unit_type' },
    { 
      title: 'Cost Price', 
      dataIndex: 'cost_price', 
      key: 'cost_price',
      render: (text) => `Rs. ${text}`
    },
    { 
      title: 'Sale Price', 
      dataIndex: 'sale_price', 
      key: 'sale_price',
      render: (text) => `Rs. ${text}`
    },
    { 
      title: 'Stock', 
      dataIndex: 'current_stock', 
      key: 'current_stock',
      render: (text, record) => (
        <Tag color={text <= record.min_stock_alert ? 'red' : 'green'}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<DatabaseOutlined />}
            size="small"
            onClick={() => {
              setSelectedProduct(record);
              setStockDrawerOpen(true);
            }}
            title="Update Stock"
          />
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteProduct(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>📦 Products Inventory</Typography.Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Products" 
              value={products.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Low Stock" 
              value={lowStockProducts.length}
              valueStyle={{ color: lowStockProducts.length > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="کل Stock Value" 
              value={Math.round(products.reduce((sum, p) => sum + (p.current_stock * p.sale_price), 0))}
              prefix="Rs. "
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          نیا Product
        </Button>
        <Button icon={<FileExcelOutlined />} onClick={exportToExcel}>
          Excel میں Export
        </Button>
        <Button icon={<FilePdfOutlined />} onClick={exportToPDF}>
          PDF میں Export
        </Button>
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1000 }}
        />
      </Spin>

      <Modal
        title="📦 نیا Product شامل کریں"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Product نام" rules={[{ required: true, message: 'ضروری ہے' }]}>
                <Input placeholder="جیسے: A4 کاغذ" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="product_type" label="قسم" rules={[{ required: true, message: 'ضروری ہے' }]}>
                <Input placeholder="جیسے: Paper" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unit_type" label="یونٹ" rules={[{ required: true, message: 'ضروری ہے' }]}>
                <Input placeholder="جیسے: Pack" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sheets_per_pack" label="Sheets Per Pack">
                <InputNumber min={0} size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cost_price" label="Cost Price" rules={[{ required: true }]}>
                <InputNumber min={0} size="large" style={{ width: '100%' }} prefix="Rs. " />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sale_price" label="Sale Price" rules={[{ required: true }]}>
                <InputNumber min={0} size="large" style={{ width: '100%' }} prefix="Rs. " />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="current_stock" label="موجودہ Stock" rules={[{ required: true }]}>
                <InputNumber min={0} size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="min_stock_alert" label="Low Stock الرٹ">
                <InputNumber min={0} size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="تفصیل">
            <Input.TextArea rows={3} placeholder="Product کی تفصیل" />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => {
              setModalOpen(false);
              form.resetFields();
            }} size="large">منسوخ</Button>
            <Button type="primary" htmlType="submit" loading={loading} size="large">محفوظ کریں</Button>
          </Space>
        </Form>
      </Modal>

      <Drawer
        title="📊 Stock اپڈیٹ کریں"
        open={stockDrawerOpen}
        onClose={() => {
          setStockDrawerOpen(false);
          setSelectedProduct(null);
        }}
        width={400}
        bodyStyle={{ paddingBottom: 80 }}
      >
        {selectedProduct && (
          <div>
            <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>موجودہ Stock</div>
                <div style={{ fontSize: 32, fontWeight: 'bold' }}>{selectedProduct.current_stock}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{selectedProduct.name}</div>
              </div>
            </Card>

            <Form 
              layout="vertical" 
              onFinish={(values) => handleStockUpdate(selectedProduct.id, values.quantity)}
            >
              <Form.Item 
                name="quantity" 
                label="Stock میں تبدیلی" 
                rules={[{ required: true, message: 'مقدار درج کریں' }]}
              >
                <InputNumber 
                  placeholder="مثال: 50 (اضافہ) یا -10 (کمی)"
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>

              <Card style={{ background: '#f5f5f5', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                  <strong>نوٹ:</strong> مثبت نمبر stock میں اضافہ، منفی نمبر کم کرتا ہے
                </div>
              </Card>

              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setStockDrawerOpen(false)} size="large">منسوخ</Button>
                <Button type="primary" htmlType="submit" loading={loading} size="large">اپڈیٹ کریں</Button>
              </Space>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default ProductList;
