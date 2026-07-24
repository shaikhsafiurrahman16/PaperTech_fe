import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PlusOutlined,
  ProfileOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../services/apiClient";
import usePermissions from "../../hooks/usePermissions";

const formatMoney = (value) => `Rs. ${Number(value ?? 0).toFixed(2)}`;

function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const { canCreate, canUpdate, canDelete } = usePermissions("vendors");
  const { canCreate: canCreatePayment } = usePermissions("payments");

  const fetchVendors = async () => {
    try {
      setPageLoading(true);
      const response = await api.get("/vendors");
      setVendors(response.data.data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to load vendors");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreateVendor = () => {
    setEditingVendor(null);
    vendorForm.resetFields();
    vendorForm.setFieldsValue({ opening_balance: 0, username: "", password: "" });
    setVendorModalOpen(true);
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    vendorForm.setFieldsValue({
      full_name: vendor.full_name,
      company_name: vendor.company_name,
      phone: vendor.phone,
      address: vendor.address,
      cnic: vendor.cnic,
    });
    setVendorModalOpen(true);
  };

  const handleDeleteVendor = async (id) => {
    try {
      await api.delete(`/vendors/${id}`);
      message.success("Vendor deleted successfully");
      fetchVendors();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete vendor");
    }
  };

  const handleSaveVendor = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        opening_balance: Number(values.opening_balance || 0),
      };

      if (editingVendor) {
        await api.put(`/vendors/${editingVendor.id}`, payload);
        message.success("Vendor updated successfully");
      } else {
        await api.post("/vendors", payload);
        message.success("Vendor created successfully");
      }

      setVendorModalOpen(false);
      setEditingVendor(null);
      vendorForm.resetFields();
      fetchVendors();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save vendor");
    } finally {
      setLoading(false);
    }
  };

  const openLedger = async (vendor) => {
    try {
      setSelectedVendor(vendor);
      setLedgerModalOpen(true);
      setLedgerLoading(true);
      const response = await api.get(`/vendor-ledger/${vendor.id}`);
      setLedger(response.data.data?.ledger || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to load vendor ledger");
    } finally {
      setLedgerLoading(false);
    }
  };

  const openPaymentModal = (vendor) => {
    setSelectedVendor(vendor);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({ vendor_id: vendor.id, payment_method: "cash" });
    setPaymentModalOpen(true);
  };

  const handleVendorPayment = async (values) => {
    try {
      setLoading(true);
      await api.post("/vendor-payments", {
        vendor_id: selectedVendor.id,
        amount: Number(values.amount || 0),
        payment_method: values.payment_method,
        notes: values.notes,
      });
      message.success("Vendor payment saved successfully");
      setPaymentModalOpen(false);
      setSelectedVendor(null);
      paymentForm.resetFields();
      fetchVendors();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredVendors = normalizedSearch
    ? vendors.filter((vendor) =>
      [
        vendor.company_name,
        vendor.full_name,
        vendor.phone,
        vendor.username,
        vendor.cnic,
        vendor.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    )
    : vendors;

  const payableVendors = vendors.filter((vendor) => Number(vendor.current_balance || 0) > 0).length;
  const totalOpeningBalance = vendors.reduce(
    (sum, vendor) => sum + Number(vendor.opening_balance || 0),
    0
  );
  const totalPayable = vendors.reduce(
    (sum, vendor) => sum + Number(vendor.current_balance || 0),
    0
  );

  const exportToExcel = () => {
    if (filteredVendors.length === 0) {
      message.warning("No data available to export");
      return;
    }

    const data = filteredVendors.map((vendor) => ({
      Company: vendor.company_name,
      "Contact Person": vendor.full_name,
      Phone: vendor.phone,
      Address: vendor.address || "-",
      CNIC: vendor.cnic || "-",
      Username: vendor.username || "-",
      "Opening Balance": formatMoney(vendor.opening_balance),
      "Current Payable": formatMoney(vendor.current_balance),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");
    XLSX.writeFile(wb, `Vendors_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
    message.success("Exported to Excel successfully");
  };

  const exportToPDF = () => {
    if (filteredVendors.length === 0) {
      message.warning("No data available to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("TRADESTACK", 14, 20);
    doc.setFontSize(12);
    doc.text("Vendors Report", 14, 28);
    doc.setFontSize(9);
    doc.text(`Report Date: ${new Date().toLocaleDateString("en-US")}`, 14, 34);
    doc.text(`Total Vendors: ${filteredVendors.length}`, 140, 20);
    doc.text(`Total Payable: ${formatMoney(totalPayable)}`, 140, 26);

    autoTable(doc, {
      head: [["Company", "Contact", "Phone", "Opening", "Payable", "Username"]],
      body: filteredVendors.map((vendor) => [
        vendor.company_name,
        vendor.full_name,
        vendor.phone,
        formatMoney(vendor.opening_balance),
        formatMoney(vendor.current_balance),
        vendor.username || "-",
      ]),
      startY: 40,
      margin: 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 85, 135] },
    });

    doc.save(`Vendors_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    message.success("Exported to PDF successfully");
  };

  const exportLedgerToExcel = () => {
    if (ledger.length === 0) {
      message.warning("No ledger data to export");
      return;
    }

    const data = ledger.map((entry) => ({
      Date: entry.created_at ? new Date(entry.created_at).toLocaleString("en-US") : "-",
      Type: entry.transaction_type || "-",
      Reference: entry.purchase_number || entry.remarks || "-",
      Amount: formatMoney(entry.amount),
      "Previous Balance": formatMoney(entry.previous_balance),
      "Current Balance": formatMoney(entry.current_balance),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${selectedVendor?.company_name || "Vendor"}_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`);
    message.success("Ledger exported to Excel");
  };

  const exportLedgerToPDF = () => {
    if (ledger.length === 0) {
      message.warning("No ledger data to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("TRADESTACK", 14, 20);
    doc.setFontSize(14);
    doc.text(`${selectedVendor?.company_name || "Vendor"} - Ledger`, 14, 28);
    doc.setFontSize(9);
    doc.text(`Report Date: ${new Date().toLocaleDateString("en-US")}`, 14, 34);

    autoTable(doc, {
      head: [["Date", "Type", "Reference", "Amount", "Previous", "Current Balance"]],
      body: ledger.map((entry) => [
        entry.created_at ? new Date(entry.created_at).toLocaleString("en-US") : "-",
        entry.transaction_type || "-",
        entry.purchase_number || entry.remarks || "-",
        formatMoney(entry.amount),
        formatMoney(entry.previous_balance),
        formatMoney(entry.current_balance),
      ]),
      startY: 40,
      margin: 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 85, 135] },
    });

    doc.save(`${selectedVendor?.company_name || "Vendor"}_Ledger_${new Date().toISOString().split("T")[0]}.pdf`);
    message.success("Ledger exported to PDF");
  };

  const columns = [
    {
      title: "Company",
      dataIndex: "company_name",
      key: "company_name",
      render: (text) => <strong>{text}</strong>,
    },
    { title: "Contact Person", dataIndex: "full_name", key: "full_name" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Username", dataIndex: "username", key: "username" },
    {
      title: "Opening Balance",
      dataIndex: "opening_balance",
      key: "opening_balance",
      render: (value) => formatMoney(value),
    },
    {
      title: "Current Payable",
      dataIndex: "current_balance",
      key: "current_balance",
      render: (value) => (
        <Tag color={Number(value || 0) > 0 ? "red" : "green"}>
          {formatMoney(value)}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 160,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="View vendor ledger">
            <Button
              type="text"
              icon={<ProfileOutlined />}
              size="small"
              onClick={() => openLedger(record)}
            />
          </Tooltip>
          {canCreatePayment ? (
            <Tooltip title="Pay vendor">
              <Button
                type="text"
                icon={<WalletOutlined />}
                size="small"
                onClick={() => openPaymentModal(record)}
                disabled={Number(record.current_balance || 0) <= 0}
              />
            </Tooltip>
          ) : null}
          {canUpdate ? (
            <Tooltip title="Edit vendor">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditVendor(record)}
              />
            </Tooltip>
          ) : null}
          {canDelete ? (
            <Popconfirm
              title="Are you sure you want to delete this vendor?"
              onConfirm={() => handleDeleteVendor(record.id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Tooltip title="Delete vendor">
                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
              </Tooltip>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const ledgerColumns = [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (value) => (value ? new Date(value).toLocaleString("en-US") : "-"),
    },
    {
      title: "Type",
      dataIndex: "transaction_type",
      key: "transaction_type",
      render: (type) => <Tag color={type === "payment" ? "green" : "blue"}>{type}</Tag>,
    },
    {
      title: "Reference",
      key: "reference",
      render: (_, record) => record.purchase_number || record.remarks || "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (value) => formatMoney(value),
    },
    {
      title: "Previous",
      dataIndex: "previous_balance",
      key: "previous_balance",
      render: (value) => formatMoney(value),
    },
    {
      title: "Balance",
      dataIndex: "current_balance",
      key: "current_balance",
      render: (value) => formatMoney(value),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>Vendors Management</Typography.Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Vendors" value={vendors.length} valueStyle={{ color: "#1890ff" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Payable Vendors" value={payableVendors} valueStyle={{ color: "#ff4d4f" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Opening Balance" value={totalOpeningBalance} prefix="Rs. " valueStyle={{ color: "#52c41a" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Payable" value={totalPayable} prefix="Rs. " valueStyle={{ color: totalPayable > 0 ? "#ff4d4f" : "#52c41a" }} />
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
            placeholder="Search vendors"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ maxWidth: 360, flex: "1 1 280px" }}
          />
          <Space wrap style={{ justifyContent: "flex-end" }}>
            {canCreate ? (
              <Tooltip title="Add a new vendor">
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateVendor}>
                  Add New Vendor
                </Button>
              </Tooltip>
            ) : null}
            <Tooltip title="Export visible vendors to Excel">
              <Button icon={<FileExcelOutlined />} onClick={exportToExcel}>
                Excel Export
              </Button>
            </Tooltip>
            <Tooltip title="Export visible vendors to PDF">
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
            dataSource={filteredVendors}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 1100 }}
            bordered
            sticky
            className="papertech-table-wrapper"
          />
        </Spin>
      </Card>

      <Modal
        title={editingVendor ? "Edit Vendor" : "Add New Vendor"}
        open={vendorModalOpen}
        onCancel={() => {
          setVendorModalOpen(false);
          setEditingVendor(null);
          vendorForm.resetFields();
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
                setVendorModalOpen(false);
                vendorForm.resetFields();
              }}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              size="large"
              onClick={() => vendorForm.submit()}
            >
              {editingVendor ? "Update Vendor" : "Save Vendor"}
            </Button>
          </>
        }
      >
        <Form layout="vertical" form={vendorForm} onFinish={handleSaveVendor} autoComplete="off" style={{ marginTop: "8px" }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="company_name"
                label="Company Name"
                rules={[
                  { required: true, message: "Company name is required" },
                  { whitespace: true, message: "Cannot be empty spaces" },
                ]}
              >
                <Input placeholder="e.g.: Ali Paper Mills" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Contact Person"
                rules={[
                  { required: true, message: "Contact person is required" },
                  { whitespace: true, message: "Cannot be empty spaces" },
                ]}
              >
                <Input placeholder="e.g.: Ahmad Ali" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
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
          </Row>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Enter vendor address" style={{ resize: "none" }} />
          </Form.Item>

          {!editingVendor && (
            <>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="opening_balance"
                    label="Opening Balance"
                    rules={[{ type: "number", min: 0, message: "Enter a valid number" }]}
                  >
                    <InputNumber placeholder="e.g.: 50000" min={0} style={{ width: "100%" }} size="large" prefix="Rs. " />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="username"
                    label="Username"
                    rules={[
                      { required: true, message: "Username is required" },
                      { pattern: /^\S+$/, message: "Cannot contain spaces" },
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
            </>
          )}

          {editingVendor && (
            <Form.Item label="Username">
              <Input value={editingVendor.username} disabled size="large" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={selectedVendor ? `${selectedVendor.company_name} Ledger` : "Vendor Ledger"}
        open={ledgerModalOpen}
        onCancel={() => {
          setLedgerModalOpen(false);
          setSelectedVendor(null);
          setLedger([]);
        }}
        centered
        width={860}
        styles={{
          footer: {
            padding: "16px 24px",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "right",
            gap: "12px",
          },
          body: {
            padding: "16px 24px 24px",
          },
        }}
        footer={
          <>
            <Button icon={<FileExcelOutlined />} size="large" onClick={exportLedgerToExcel}>
              Excel
            </Button>
            <Button icon={<FilePdfOutlined />} danger size="large" onClick={exportLedgerToPDF}>
              PDF
            </Button>
            <Button
              size="large"
              onClick={() => {
                setLedgerModalOpen(false);
                setSelectedVendor(null);
                setLedger([]);
              }}
            >
              Close
            </Button>
          </>
        }
      >
        <Spin spinning={ledgerLoading}>
          <Table
            rowKey="id"
            columns={ledgerColumns}
            dataSource={ledger}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
            bordered
            sticky
            className="papertech-table-wrapper"
          />
        </Spin>
      </Modal>

      <Modal
        title={selectedVendor ? `Pay ${selectedVendor.company_name}` : "Vendor Payment"}
        open={paymentModalOpen}
        onCancel={() => {
          setPaymentModalOpen(false);
          setSelectedVendor(null);
          paymentForm.resetFields();
        }}
        centered
        width={520}
        styles={{
          footer: {
            padding: "16px 24px",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "center",
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
                setPaymentModalOpen(false);
                paymentForm.resetFields();
              }}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              size="large"
              onClick={() => paymentForm.submit()}
            >
              Save Payment
            </Button>
          </>
        }
      >
        {selectedVendor && (
          <Card style={{ marginBottom: 16 }}>
            <Statistic
              title="Current Payable"
              value={Number(selectedVendor.current_balance || 0)}
              prefix="Rs. "
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        )}

        <Form layout="vertical" form={paymentForm} onFinish={handleVendorPayment} autoComplete="off" style={{ marginTop: "8px" }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Payment Amount"
                rules={[
                  { required: true, message: "Payment amount is required" },
                  { type: "number", min: 1, message: "Must be greater than zero" },
                ]}
              >
                <InputNumber placeholder="e.g.: 10000" min={1} style={{ width: "100%" }} size="large" prefix="Rs. " />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_method" label="Payment Method">
                <Select
                  size="large"
                  placeholder="Select method"
                  options={[
                    { label: "Cash", value: "cash" },
                    { label: "Bank", value: "bank" },
                    { label: "Cheque", value: "cheque" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Payment notes" style={{ resize: "none" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default VendorList;