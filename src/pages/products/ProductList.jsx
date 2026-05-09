import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Tooltip,
  Drawer,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EditOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import api from "../../api/axiosConfig";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockDrawerOpen, setStockDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products");
      setProducts(response.data.data);
    } catch (error) {
      message.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenProductModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
    form.setFieldsValue({
      name: product.name,
      product_type: product.product_type,
      unit_type: product.unit_type,
      sheets_per_pack: product.sheets_per_pack,
      cost_price: product.cost_price,
      sale_price: product.sale_price,
      current_stock: product.current_stock,
      min_stock_alert: product.min_stock_alert,
      description: product.description,
    });
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, values);
        message.success("Product updated successfully");
      } else {
        await api.post("/products", values);
        message.success("Product saved successfully");
      }
      setModalOpen(false);
      setEditingProduct(null);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId, quantity) => {
    try {
      await api.patch(`/products/${productId}/stock`, {
        quantity_change: quantity,
      });
      message.success("Stock updated successfully");
      setStockDrawerOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      message.error("Failed to update stock");
    }
  };

  const handleDeleteProduct = async (productId) => {
    Modal.confirm({
      title: "Delete Product",
      content: "Are you sure?",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`/products/${productId}`);
          message.success("Product deleted successfully");
          fetchProducts();
        } catch (error) {
          message.error("Failed to delete product");
        }
      },
    });
  };

  const exportToExcel = () => {
    const data = products.map((p) => ({
      Name: p.name,
      Type: p.product_type,
      Unit: p.unit_type,
      "Cost Price": `Rs. ${p.cost_price}`,
      "Sale Price": `Rs. ${p.sale_price}`,
      "Current Stock": p.current_stock,
      "Min Stock Alert": p.min_stock_alert,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("PAPERTECH", 14, 18);
    doc.setFontSize(12);
    doc.text("Products Inventory Report", 14, 26);
    doc.setFontSize(9);
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')}`, 14, 32);
    doc.text(`Total Products: ${products.length}`, 140, 26);

    const tableData = products.map((p) => [
      p.name,
      p.product_type,
      `Rs. ${Number(p.cost_price).toFixed(2)}`,
      `Rs. ${Number(p.sale_price).toFixed(2)}`,
      p.current_stock,
      p.min_stock_alert,
    ]);

    doc.autoTable({
      head: [["Name", "Type", "Cost Price", "Sale Price", "Stock", "Alert"]],
      body: tableData,
      startY: 38,
      margin: 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 85, 135] },
    });

    doc.save(`Products_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const lowStockProducts = products.filter(
    (p) => p.current_stock <= p.min_stock_alert,
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Tooltip title={record.description}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    { title: "Type", dataIndex: "product_type", key: "product_type" },
    { title: "Unit", dataIndex: "unit_type", key: "unit_type" },
    {
      title: "Cost Price",
      dataIndex: "cost_price",
      key: "cost_price",
      render: (text) => `Rs. ${text}`,
    },
    {
      title: "Sale Price",
      dataIndex: "sale_price",
      key: "sale_price",
      render: (text) => `Rs. ${text}`,
    },
    {
      title: "Stock",
      dataIndex: "current_stock",
      key: "current_stock",
      render: (text, record) => (
        <Tag color={text <= record.min_stock_alert ? "red" : "green"}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditProduct(record)}
            title="Edit Product"
          />
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
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={lowStockProducts.length}
              valueStyle={{
                color: lowStockProducts.length > 0 ? "#ff4d4f" : "#52c41a",
                fontWeight: "bold",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Stock Value"
              value={Math.round(
                products.reduce(
                  (sum, p) => sum + p.current_stock * p.sale_price,
                  0,
                ),
              )}
              prefix="Rs. "
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenProductModal}
        >
          New Product
        </Button>

        <Button icon={<FileExcelOutlined />} onClick={exportToExcel}>
          Export Excel
        </Button>

        <Button icon={<FilePdfOutlined />} onClick={exportToPDF}>
          Export PDF
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
        title={editingProduct ? '📦 Edit Product' : '📦 Add New Product'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g.: A4 Paper" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="product_type"
                label="Type"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g.: Paper" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unit_type"
                label="Unit"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g.: Pack" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sheets_per_pack" label="Sheets Per Pack">
                <InputNumber min={0} size="large" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cost_price"
                label="Cost Price"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  size="large"
                  style={{ width: "100%" }}
                  prefix="Rs. "
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sale_price"
                label="Sale Price"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  size="large"
                  style={{ width: "100%" }}
                  prefix="Rs. "
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="current_stock"
                label="Current Stock"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} size="large" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="min_stock_alert" label="Low Stock Alert">
                <InputNumber min={0} size="large" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Product description" />
          </Form.Item>

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setModalOpen(false);
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
              Save
            </Button>
          </Space>
        </Form>
      </Modal>

      <Drawer
        title="📊 Update Stock"
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
            <Card
              style={{
                marginBottom: 24,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Current Stock</div>
                <div style={{ fontSize: 32, fontWeight: "bold" }}>
                  {selectedProduct.current_stock}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                  {selectedProduct.name}
                </div>
              </div>
            </Card>

            <Form
              layout="vertical"
              onFinish={(values) =>
                handleStockUpdate(selectedProduct.id, values.quantity)
              }
            >
              <Form.Item
                name="quantity"
                label="Stock Change"
                rules={[{ required: true, message: "Enter quantity" }]}
              >
                <InputNumber
                  placeholder="e.g.: 50 (add) or -10 (reduce)"
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>

              <Card style={{ background: "#f5f5f5", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                  <strong>Note:</strong> Positive values add stock, negative
                  values subtract stock.
                </div>
              </Card>

              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={() => setStockDrawerOpen(false)} size="large">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                >
                  Update
                </Button>
              </Space>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default ProductList;
