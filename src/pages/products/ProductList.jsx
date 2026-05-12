import { useEffect, useState } from "react";
import {
  Table,
  Button,
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
  Modal,
  Select,
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
import autoTable from "jspdf-autotable";

const PAPER_TYPE_OPTIONS = [
  "carbon",
  "Indonesia",
  "Crown",
  "Local",
  "Bleach",
  "art",
  "Matt",
  "Sticker",
  "Everycard",
  "News",
  "Filecard",
];
const SIZE_OPTIONS = [
  "23x36",
  "20x30",
  "25x36",
  "27x34",
  "18x23",
  "17x27",
  "30x40",
  "22x28",
];

const GRAM_OPTIONS = [
  42,
  52,
  60,
  68,
  70,
  75,
  80,
  90,
  100,
  150,
  113,
  128,
  230,
  250,
  300,
  350,
  400,
];

const UNIT_OPTIONS = ["Card", "Paper", "sticker"];

const getSheetsPerPack = (unitType) =>
  String(unitType || "").toLowerCase() === "paper" ? 500 : 100;

function ProductList() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockDrawerOpen, setStockDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedUnitType = Form.useWatch("unit_type", form);

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

  useEffect(() => {
    if (modalOpen && selectedUnitType) {
      form.setFieldValue("sheets_per_pack", getSheetsPerPack(selectedUnitType));
    }
  }, [form, modalOpen, selectedUnitType]);

  const handleOpenProductModal = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ unit_type: "Paper", sheets_per_pack: 500 });
    setModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
    form.setFieldsValue({
      name: product.name,
      product_type: product.product_type,
      size: product.size,
      gram: product.gram ? Number(product.gram) : undefined,
      unit_type: product.unit_type,
      sheets_per_pack: getSheetsPerPack(product.unit_type),
      cost_price: Number(product.cost_price || 0),
      sale_price: Number(product.sale_price || 0),
      current_stock: Number(product.current_stock || 0),
      min_stock_alert: Number(product.min_stock_alert || 0),
      description: product.description,
    });
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        sheets_per_pack: getSheetsPerPack(values.unit_type),
        gram: Number(values.gram || 0),
        cost_price: Number(values.cost_price || 0),
        sale_price: Number(values.sale_price || 0),
        current_stock: Number(values.current_stock || 0),
        min_stock_alert: Number(values.min_stock_alert || 0),
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        message.success("Product updated successfully");
      } else {
        await api.post("/products", payload);
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
    if (filteredProducts.length === 0) {
      message.warning("No data available to export");
      return;
    }

    const data = filteredProducts.map((p) => ({
      Name: p.name,
      Type: p.product_type,
      Size: p.size,
      Gram: p.gram,
      Unit: p.unit_type,
      "Sheets Per Pack": p.sheets_per_pack,
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
    if (filteredProducts.length === 0) {
      message.warning("No data available to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("PAPERTECH", 14, 18);
    doc.setFontSize(12);
    doc.text("Products Inventory Report", 14, 26);
    doc.setFontSize(9);
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')}`, 14, 32);
    doc.text(`Total Products: ${filteredProducts.length}`, 140, 26);

    const tableData = filteredProducts.map((p) => [
      p.name,
      p.product_type,
      p.size || "",
      p.gram || "",
      p.unit_type,
      p.sheets_per_pack,
      `Rs. ${Number(p.cost_price).toFixed(2)}`,
      `Rs. ${Number(p.sale_price).toFixed(2)}`,
      p.current_stock,
      p.min_stock_alert,
    ]);

    autoTable(doc, {
      head: [["Name", "Type", "Size", "Gram", "Unit", "Sheets", "Cost Price", "Sale Price", "Stock", "Alert"]],
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
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProducts = normalizedSearch
    ? products.filter((p) =>
      [p.name, p.product_type, p.size, p.gram, p.unit_type, p.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch)),
    )
    : products;

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
    { title: "Size", dataIndex: "size", key: "size" },
    { title: "Gram", dataIndex: "gram", key: "gram" },
    { title: "Unit", dataIndex: "unit_type", key: "unit_type" },
    {
      title: "Sheets/Pack",
      dataIndex: "sheets_per_pack",
      key: "sheets_per_pack",
    },
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
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit product">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditProduct(record)}
            />
          </Tooltip>
          <Tooltip title="Update product stock">
            <Button
              type="text"
              icon={<DatabaseOutlined />}
              size="small"
              onClick={() => {
                setSelectedProduct(record);
                setStockDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete product">
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteProduct(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>Products Inventory</Typography.Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Products"
              value={products.length}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
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
        <Col xs={24} sm={12} md={8}>
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

      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Input.Search
            allowClear
            placeholder="Search products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 360, flex: "1 1 280px" }}
          />
          <Space wrap style={{ justifyContent: "flex-end" }}>
            <Tooltip title="Add a new product">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenProductModal}
              >
                New Product
              </Button>
            </Tooltip>

            <Tooltip title="Export visible products to Excel">
              <Button icon={<FileExcelOutlined />} onClick={exportToExcel}>
                Export Excel
              </Button>
            </Tooltip>

            <Tooltip title="Export visible products to PDF">
              <Button icon={<FilePdfOutlined />} onClick={exportToPDF}>
                Export PDF
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            pagination={{ pageSize: 15 }}
            scroll={{ x: 1000 }}
            bordered
          />
        </Spin>
      </Card>

      <Drawer
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        width={700}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[
                  { required: true, message: "Product name is required" },
                  { whitespace: true, message: "Product name cannot be empty spaces" },
                ]}
              >
                <Input placeholder="e.g.: A4 Paper" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="product_type"
                label="Type"
                rules={[
                  { required: true, message: "Type is required" },
                  { whitespace: true, message: "Type cannot be empty spaces" },
                ]}
              >
                <Select
                  size="large"
                  placeholder="Select paper type"
                  options={PAPER_TYPE_OPTIONS.map((value) => ({
                    label: value,
                    value,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: "Size is required" }]}
              >
                <Select
                  size="large"
                  placeholder="Select size"
                  options={SIZE_OPTIONS.map((value) => ({ label: value, value }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gram"
                label="Gram"
                rules={[{ required: true, message: "Gram is required" }]}
              >
                <Select
                  size="large"
                  placeholder="Select gram"
                  options={GRAM_OPTIONS.map((value) => ({ label: value, value }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unit_type"
                label="Unit"
                rules={[{ required: true, message: "Unit is required" }]}
              >
                <Select
                  size="large"
                  placeholder="Select unit"
                  options={UNIT_OPTIONS.map((value) => ({ label: value, value }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sheets_per_pack" label="Sheets Per Pack">
                <InputNumber
                  min={0}
                  disabled
                  size="large"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cost_price"
                label="Cost Price"
                rules={[{ required: true, message: "Cost price is required" }]}
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
                rules={[{ required: true, message: "Sale price is required" }]}
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
                rules={[{ required: true, message: "Current stock is required" }]}
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
            <Tooltip title="Close without saving">
              <Button
                onClick={() => {
                  setModalOpen(false);
                  form.resetFields();
                }}
                size="large"
              >
                Cancel
              </Button>
            </Tooltip>
            <Tooltip title="Save product details">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
              >
                Save
              </Button>
            </Tooltip>
          </Space>
        </Form>
      </Drawer>

      <Drawer
        title="Update Stock"
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
                <Tooltip title="Close without updating stock">
                  <Button onClick={() => setStockDrawerOpen(false)} size="large">
                    Cancel
                  </Button>
                </Tooltip>
                <Tooltip title="Apply this stock change">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                  >
                    Update
                  </Button>
                </Tooltip>
              </Space>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default ProductList;
