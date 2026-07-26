import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  message,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Space,
  Spin,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { generateStyledPDF } from "../../lib/pdfTemplateEngine";
import api from "../../services/apiClient";
import usePermissions from "../../hooks/usePermissions";

const formatMoney = (value) => `Rs. ${Number(value ?? 0).toFixed(2)}`;

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();
  const { canCreate, canUpdate, canDelete } = usePermissions("customers");

  const fetchCustomers = async () => {
    try {
      setPageLoading(true);
      const response = await api.get("/customers");
      setCustomers(response.data.data || []);
    } catch (error) {
      message.error("Failed to load customers");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    form.setFieldsValue({ username: "", password: "" });
    setDrawerOpen(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setDrawerOpen(true);
    form.setFieldsValue({
      full_name: customer.full_name,
      shop_name: customer.shop_name,
      phone: customer.phone,
      address: customer.address,
      cnic: customer.cnic,
      credit_limit: Number(customer.credit_limit || 0),
      username: customer.username,
    });
  };

  const handleDeleteCustomer = async (id) => {
    try {
      await api.delete(`/customers/${id}`);
      message.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        credit_limit: Number(values.credit_limit || 0),
      };

      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, payload);
        message.success("Customer updated successfully");
      } else {
        await api.post("/customers", payload);
        message.success("Customer created successfully");
      }

      setDrawerOpen(false);
      setEditingCustomer(null);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (filteredCustomers.length === 0) {
      message.warning("No data available to export");
      return;
    }

    const data = filteredCustomers.map((c) => ({
      "Shop Name": c.shop_name,
      "Owner Name": c.full_name,
      Phone: c.phone,
      Address: c.address || "-",
      CNIC: c.cnic || "-",
      "Credit Limit": formatMoney(c.credit_limit),
      "Current Balance": formatMoney(c.current_balance),
      Type: c.customer_type === "star" ? "Star" : "Local",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(
      wb,
      `Customers_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    message.success("Exported to Excel successfully");
  };

  const exportToPDF = async () => {
    if (filteredCustomers.length === 0) {
      message.warning("No data available to export");
      return;
    }

    const tableHeaders = ["Shop Name", "Full Name", "Phone", "Credit Limit", "Current Balance", "Type"];
    const tableBody = filteredCustomers.map((c) => [
      c.shop_name,
      c.full_name,
      c.phone,
      formatMoney(c.credit_limit),
      formatMoney(c.current_balance),
      c.customer_type === "star" ? "Star" : "Local",
    ]);

    await generateStyledPDF({
      title: "Customers Directory & Ledger Summary",
      subtitle: `Total Customers: ${filteredCustomers.length}`,
      filename: `Customers_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      docKey: `CUSTOMERS_REPORT`,
      showQRCode: false,
      showSignature: false,
      metaLeft: [
        `Issued By: TRADESTACK`,
        `Report Type: Customer Accounts Audit`,
        `Generated: ${new Date().toLocaleString()}`,
      ],
      metaRight: [
        `Total Customers: ${filteredCustomers.length}`,
        `Total Credit Limit: ${formatMoney(totalCredit)}`,
        `Total Balance: ${formatMoney(totalBalance)}`,
      ],
      tableHeaders,
      tableBody,
      summaryRows: [
        { label: "Total Customers:", value: String(filteredCustomers.length) },
        { label: "Total Outstanding Balance:", value: formatMoney(totalBalance), bold: true },
      ],
    });

    message.success("Exported to PDF successfully");
  };

  const columns = [
    {
      title: "Shop",
      dataIndex: "shop_name",
      key: "shop_name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Name",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Credit Limit",
      dataIndex: "credit_limit",
      key: "credit_limit",
      render: (text) => formatMoney(text),
    },
    {
      title: "Current Balance",
      dataIndex: "current_balance",
      key: "current_balance",
      render: (text) => (
        <span
          style={{
            color: text > 0 ? "#ff4d4f" : "#52c41a",
            fontWeight: "bold",
          }}
        >
          {formatMoney(text)}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "customer_type",
      key: "customer_type",
      render: (type) => (
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            background: type === "star" ? "#fff1f0" : "#f5f5f5",
            color: type === "star" ? "#ff4d4f" : "#666",
          }}
        >
          {type === "star" ? "Star" : "Local"}
        </span>
      ),
    },
    (canUpdate || canDelete) ? {
      title: "Action",
      key: "action",
      width: 96,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {canUpdate ? (
            <Tooltip title="Edit customer">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditCustomer(record)}
              />
            </Tooltip>
          ) : null}
          {canDelete ? (
            <Popconfirm
              title="Are you sure you want to delete this customer?"
              onConfirm={() => handleDeleteCustomer(record.id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Tooltip title="Delete customer">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    } : null,
  ].filter(Boolean);

  const starCustomers = customers.filter(
    (c) => c.customer_type === "star",
  ).length;
  const totalCredit = customers.reduce(
    (sum, c) => sum + Number(c.credit_limit || 0),
    0,
  );
  const totalBalance = customers.reduce(
    (sum, c) => sum + Number(c.current_balance || 0),
    0,
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCustomers = normalizedSearch
    ? customers.filter((c) =>
      [c.shop_name, c.full_name, c.phone, c.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch)),
    )
    : customers;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>Customers Management</Typography.Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={customers.length}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Star Customers"
              value={starCustomers}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Credit Limit"
              value={totalCredit}
              prefix="Rs. "
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Balance"
              value={totalBalance}
              prefix="Rs. "
              valueStyle={{ color: totalBalance > 0 ? "#ff4d4f" : "#52c41a" }}
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
            placeholder="Search customers"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 360, flex: "1 1 280px" }}
          />
          <Space wrap style={{ justifyContent: "flex-end" }}>
            {canCreate ? (
              <Tooltip title="Add a new customer">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateCustomer}
                >
                  Add New Customer
                </Button>
              </Tooltip>
            ) : null}
            <Tooltip title="Export visible customers to Excel">
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                type="primary"
              >
                Excel Export
              </Button>
            </Tooltip>
            <Tooltip title="Export visible customers to PDF">
              <Button icon={<FilePdfOutlined />} danger onClick={exportToPDF}>
                PDF Export
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Card>

      <Card>
        <Spin spinning={pageLoading}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredCustomers.map((c, idx) => ({ ...c, key: c.id || idx }))}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            bordered
            sticky
            className="papertech-table-wrapper"
          />
        </Spin>
      </Card>

      <Modal
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        open={drawerOpen}
        onCancel={() => {
          setDrawerOpen(false);
          setEditingCustomer(null);
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
              {editingCustomer ? "Update Customer" : "Save Customer"}
            </Button>
          </>
        }
      >
        <Form layout="vertical" form={form} onFinish={onFinish} autoComplete="off" style={{ marginTop: "8px" }}>
          <Form.Item
            name="full_name"
            label="Owner Full Name"
            rules={[
              { required: true, message: "Name is required" },
              { whitespace: true, message: "Name cannot be empty spaces" },
            ]}
          >
            <Input placeholder="e.g.: Ahmad Ali" size="large" />
          </Form.Item>

          <Form.Item
            name="shop_name"
            label="Shop Name"
            rules={[
              { required: true, message: "Shop name is required" },
              { whitespace: true, message: "Shop name cannot be empty spaces" },
            ]}
          >
            <Input placeholder="e.g.: Ahmad Paper House" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: "Phone is required" },
                  { pattern: /^\d{1,11}$/, message: "Digits only, max 11" },
                ]}
              >
                <Input maxLength={11} placeholder="03001234567" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="cnic"
                label="CNIC"
                rules={[
                  { pattern: /^\d{1,13}$/, message: "Digits only, max 13" },
                ]}
              >
                <Input maxLength={13} placeholder="1234512345671" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="credit_limit"
                label="Credit Limit"
                rules={[{ type: "number", min: 0, message: "Enter a valid number" }]}
              >
                <InputNumber
                  placeholder="e.g.: 50000"
                  style={{ width: "100%" }}
                  size="large"
                  prefix="Rs. "
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Enter full shop address" style={{ resize: "none" }} />
          </Form.Item>

          {!editingCustomer && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="username"
                  label="Username (for Login)"
                  rules={[
                    { required: true, message: "Username is required" },
                    { pattern: /^\S+$/, message: "Username cannot contain spaces" },
                  ]}
                >
                  <Input placeholder="Enter username" autoComplete="new-password" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: "Password is required" },
                    { min: 6, message: "At least 6 characters" },
                  ]}
                >
                  <Input.Password placeholder="Enter password" autoComplete="new-password" size="large" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {editingCustomer && (
            <Form.Item label="Username">
              <Input value={editingCustomer.username} disabled size="large" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default CustomerList;
