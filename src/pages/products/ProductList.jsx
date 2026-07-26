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
  Modal,
  Select,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { generateStyledPDF } from "../../lib/pdfTemplateEngine";
import api from "../../services/apiClient";
import usePermissions from "../../hooks/usePermissions";
import { APP_NAME, getIndustryConfig } from "../../constants/industryConfig";
import { useSelector } from "react-redux";

const getSheetsPerPack = (unitType) =>
  String(unitType || "").toLowerCase() === "paper"
    ? 500
    : ["card", "sticker"].includes(String(unitType || "").toLowerCase())
      ? 100
      : 1;

function ProductList() {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const selectedUnitType = Form.useWatch("unit_type", form);
  const { canCreate, canUpdate, canDelete } = usePermissions("products");
  const { user } = useSelector((state) => state.auth);
  const industryConfig = getIndustryConfig(user?.field_type);

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
    form.setFieldsValue({ unit_type: industryConfig.unitOptions[0], sheets_per_pack: getSheetsPerPack(industryConfig.unitOptions[0]), product_specs: {} });
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
      product_specs: product.product_specs || {},
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
        size: industryConfig.showPaperFields ? values.size : null,
        gram: industryConfig.showPaperFields ? Number(values.gram || 0) : 0,
        sheets_per_pack: getSheetsPerPack(values.unit_type),
        product_specs: values.product_specs || {},
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
      Unit: p.unit_type,
      ...(industryConfig.showPaperFields ? { Size: p.size, Gram: p.gram, "Sheets Per Pack": p.sheets_per_pack } : {}),
      ...industryConfig.specFields.reduce((row, field) => {
        row[field.label] = p.product_specs?.[field.name] || "-";
        return row;
      }, {}),
      "Cost Price": `Rs. ${p.cost_price}`,
      "Sale Price": `Rs. ${p.sale_price}`,
      "Current Stock (Sheets)": p.current_stock,
      "Min Stock Alert": p.min_stock_alert,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products.xlsx");
  };

  const exportToPDF = async () => {
    if (filteredProducts.length === 0) {
      message.warning("No data available to export");
      return;
    }

    const tableHeaders = ["Name", "Type", "Size", "Gram", "Cost Price", "Sale Price", "Current Stock"];
    const tableBody = filteredProducts.map((p) => [
      p.name,
      p.product_type || "-",
      p.size || "-",
      p.gram || "-",
      `Rs. ${Number(p.cost_price || 0).toFixed(2)}`,
      `Rs. ${Number(p.sale_price || 0).toFixed(2)}`,
      p.current_stock || 0,
    ]);

    const totalStock = filteredProducts.reduce((sum, p) => sum + Number(p.current_stock || 0), 0);

    await generateStyledPDF({
      title: "Products Inventory & Stock Catalog",
      subtitle: `Total Products: ${filteredProducts.length}`,
      filename: `Products_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      docKey: `PRODUCTS_REPORT`,
      showQRCode: false,
      showSignature: false,
      metaLeft: [
        `Issued By: ${APP_NAME}`,
        `Report Type: Inventory Stock Audit`,
        `Generated: ${new Date().toLocaleString()}`,
      ],
      metaRight: [
        `Total Product Lines: ${filteredProducts.length}`,
        `Total Stock Units: ${totalStock}`,
      ],
      tableHeaders,
      tableBody,
      summaryRows: [
        { label: "Total Product Items:", value: String(filteredProducts.length) },
        { label: "Total Stock Inventory:", value: String(totalStock), bold: true },
      ],
    });
  };

  const lowStockProducts = products.filter(
    (p) => p.current_stock <= p.min_stock_alert,
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProducts = normalizedSearch
    ? products.filter((p) =>
      [p.name, p.product_type, p.size, p.gram, p.unit_type, p.description]
        .concat(Object.values(p.product_specs || {}))
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
    { title: industryConfig.typeLabel, dataIndex: "product_type", key: "product_type" },
    ...(industryConfig.showPaperFields
      ? [
        { title: "Size", dataIndex: "size", key: "size" },
        { title: "Gram", dataIndex: "gram", key: "gram" },
      ]
      : industryConfig.specFields.slice(0, 4).map((field) => ({
        title: field.label,
        key: field.name,
        render: (_, record) => record.product_specs?.[field.name] || "-",
      }))),
    { title: "Unit", dataIndex: "unit_type", key: "unit_type" },
    ...(industryConfig.showPaperFields ? [{
      title: "Sheets/Pack",
      dataIndex: "sheets_per_pack",
      key: "sheets_per_pack",
    }] : []),
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
      title: industryConfig.showPaperFields ? "Stock (Sheets)" : "Stock",
      dataIndex: "current_stock",
      key: "current_stock",
      render: (text, record) => (
        <Tag color={text <= record.min_stock_alert ? "red" : "green"}>
          {text}
        </Tag>
      ),
    },
    (canUpdate || canDelete) ? {
      title: "Action",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {canUpdate ? (
            <Tooltip title="Edit product">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditProduct(record)}
              />
            </Tooltip>
          ) : null}
          {canDelete ? (
            <Tooltip title="Delete product">
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDeleteProduct(record.id)}
              />
            </Tooltip>
          ) : null}
        </Space>
      ),
    } : null,
  ].filter(Boolean);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>{industryConfig.title}</Typography.Title>
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
            {canCreate ? (
              <Tooltip title="Add a new product">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenProductModal}
                >
                  New Product
                </Button>
              </Tooltip>
            ) : null}

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

      <Modal
        title={editingProduct ? "Edit Product" : "Add New Product"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        centered
        width={700}
        styles={{
          footer: {
            padding: "16px 24px",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "flex-end",
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
                setModalOpen(false);
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
              {editingProduct ? "Update Product" : "Save Product"}
            </Button>
          </>
        }
      >
        <Form layout="vertical" form={form} onFinish={onFinish} autoComplete="off" style={{ marginTop: "8px" }}>
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
                <Input placeholder="Enter name" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="product_type"
                label={industryConfig.typeLabel}
                rules={[
                  { required: true, message: "Type is required" },
                  { whitespace: true, message: "Type cannot be empty spaces" },
                ]}
              >
                <Select
                  size="large"
                  placeholder={`Select ${industryConfig.typeLabel.toLowerCase()}`}
                  options={industryConfig.typeOptions.map((value) => ({
                    label: value,
                    value,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {industryConfig.showPaperFields ? (
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
                    options={industryConfig.sizeOptions.map((value) => ({ label: value, value }))}
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
                    options={industryConfig.gramOptions.map((value) => ({ label: value, value }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {!industryConfig.showPaperFields ? (
            <Row gutter={16}>
              {industryConfig.specFields.map((field) => (
                <Col span={12} key={field.name}>
                  <Form.Item name={["product_specs", field.name]} label={field.label}>
                    {field.options ? (
                      <Select
                        allowClear
                        size="large"
                        placeholder={`Select ${field.label.toLowerCase()}`}
                        options={field.options.map((value) => ({ label: value, value }))}
                      />
                    ) : (
                      <Input size="large" placeholder={field.label} />
                    )}
                  </Form.Item>
                </Col>
              ))}
            </Row>
          ) : null}

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
                  options={industryConfig.unitOptions.map((value) => ({ label: value, value }))}
                />
              </Form.Item>
            </Col>
            {industryConfig.showPaperFields ? (
              <Col span={12}>
                <Form.Item name="sheets_per_pack" label="Sheets Per Pack">
                  <InputNumber min={0} disabled size="large" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            ) : null}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cost_price"
                label="Cost Price"
                rules={[{ required: true, message: "Cost price is required" }]}
              >
                <InputNumber min={0} size="large" style={{ width: "100%" }} prefix="Rs. " />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sale_price"
                label="Sale Price"
                rules={[{ required: true, message: "Sale price is required" }]}
              >
                <InputNumber min={0} size="large" style={{ width: "100%" }} prefix="Rs. " />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="current_stock"
                label={industryConfig.showPaperFields ? "Current Stock (Sheets)" : "Current Stock"}
                rules={[{ required: true, message: "Current stock is required" }]}
              >
                <InputNumber min={0} size="large" style={{ width: "100%" }} disabled={Boolean(editingProduct)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="min_stock_alert" label={industryConfig.showPaperFields ? "Low Stock Alert (Sheets)" : "Low Stock Alert"}>
                <InputNumber min={0} size="large" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Product description" style={{ resize: "none" }} />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}

export default ProductList;
