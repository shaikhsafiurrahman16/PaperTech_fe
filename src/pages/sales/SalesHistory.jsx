import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  Row,
  Col,
  Space,
  message,
  Typography,
  Card,
  Statistic,
  Spin,
  Tag,
  DatePicker,
  Tooltip,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { generateStyledPDF } from "../../lib/pdfTemplateEngine";
import api from "../../services/apiClient";

const formatMoney = (value) => `Rs. ${Number(value ?? 0).toFixed(2)}`;
const getSheetsPerPack = (product) => Number(product?.sheets_per_pack || 1) || 1;

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [saleTypeFilter, setSaleTypeFilter] = useState();
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("sale");
  const [dateRange, setDateRange] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";
  const isVendor = user?.role === "vendor";
  const isInvoicePage = location.pathname.startsWith("/invoices");
  const activeInvoiceType = isInvoicePage && isVendor ? "purchase" : invoiceTypeFilter;

  const fetchData = async (filters = {}) => {
    try {
      setPageLoading(true);
      if (isInvoicePage && activeInvoiceType === "purchase") {
        const [purchaseRes] = await Promise.all([
          api.get("/purchases", { params: filters }),
        ]);
        const normalizedPurchases = (purchaseRes.data.data || []).map((purchase) => ({
          ...purchase,
          invoice_number: purchase.purchase_number,
          shop_name: purchase.company_name || purchase.full_name,
          payment_received: purchase.payment_paid,
          sale_type: purchase.purchase_type,
          invoice_source: "purchase",
        }));
        setSales(normalizedPurchases);
        setCustomers([]);
        setProducts([]);
        return;
      }

      const requests = [api.get("/sales", { params: filters })];
      if (isAdmin) {
        requests.push(api.get("/customers"));
        requests.push(api.get("/products"));
      }
      const responses = await Promise.all(requests);
      const salesRes = responses[0];
      setSales((salesRes.data.data || []).map((sale) => ({ ...sale, invoice_source: "sale" })));
      if (isAdmin) {
        setCustomers(responses[1].data.data || []);
        setProducts(responses[2].data.data || []);
      } else {
        setCustomers([]);
        setProducts([]);
      }
    } catch (error) {
      message.error("Failed to load data");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isInvoicePage, activeInvoiceType, isAdmin]);

  const searchSales = () => {
    const filters = {
      search: searchTerm || undefined,
      sale_type: activeInvoiceType === "purchase" ? undefined : saleTypeFilter,
      purchase_type: activeInvoiceType === "purchase" ? saleTypeFilter : undefined,
      from_date: dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
      to_date: dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
    };
    fetchData(filters);
  };

  const handleOpenSaleDrawer = () => {
    setEditingSale(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const handleEditSale = async (saleId) => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/${saleId}`);
      const saleData = response.data.data.sale;
      setEditingSale(saleData);
      form.setFieldsValue({
        customer_id: saleData.customer_id || null,
        sale_type: saleData.sale_type,
        discount: Number(saleData.discount),
        payment_received: Number(saleData.payment_received),
        items: response.data.data.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          quantity_unit: "pack",
        })),
      });
      setDrawerOpen(true);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to load sale details",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    try {
      setDeleteLoading(true);
      await api.delete(`/sales/${saleId}`);
      message.success("Sale deleted successfully");
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete sale");
    } finally {
      setDeleteLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const productMap = new Map(products.map((p) => [Number(p.id), p]));
      const payload = {
        ...values,
        discount: Number(values.discount || 0),
        payment_received: Number(values.payment_received || 0),
        items: (values.items || []).map((item) => ({
          product_id: Number(item.product_id),
          quantity: (() => {
            const product = productMap.get(Number(item.product_id));
            const sheetsPerPack = getSheetsPerPack(product);
            const qty = Number(item.quantity || 0);
            return item.quantity_unit === "pack" ? qty * sheetsPerPack : qty;
          })(),
          unit_price: (() => {
            const product = productMap.get(Number(item.product_id));
            const sheetsPerPack = getSheetsPerPack(product);
            const price = Number(item.unit_price || 0);
            return item.quantity_unit === "pack" ? price / sheetsPerPack : price;
          })(),
        })),
      };

      if (editingSale) {
        await api.put(`/sales/${editingSale.id}`, payload);
        message.success("Sale updated successfully");
      } else {
        await api.post("/sales", payload);
        message.success("Sale saved successfully");
      }
      setDrawerOpen(false);
      setEditingSale(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save sale");
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceView = (invoiceId, source = "sale") => {
    navigate(`/invoices/${invoiceId}`, { state: { invoiceSource: source } });
  };

  const exportToExcel = () => {
    if (sales.length === 0) {
      message.warning("No data available to export");
      return;
    }

    const data = sales.map((sale) => ({
      "Invoice #": sale.invoice_number,
      Customer: sale.shop_name,
      "Total Amount": sale.total_amount,
      Discount: sale.discount,
      "Grand Total": sale.grand_total,
      "Payment Received": sale.payment_received,
      "Remaining Balance": sale.remaining_balance,
      Type: sale.sale_type,
      Date: new Date(sale.created_at).toLocaleDateString("en-US"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(
      wb,
      `Sales_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    message.success("Exported to Excel successfully");
  };

  const exportToPDF = async () => {
    if (sales.length === 0) {
      message.warning("No data available to export");
      return;
    }

    const tableHeaders = [
      "Invoice",
      "Customer",
      "Grand Total",
      "Type",
      "Payment Received",
      "Remaining Balance",
      "Date",
    ];

    const tableBody = sales.map((sale) => [
      sale.invoice_number,
      sale.shop_name || "Walk-in Customer",
      formatMoney(sale.grand_total),
      sale.sale_type === "cash" ? "Cash" : "Credit",
      formatMoney(sale.payment_received),
      formatMoney(sale.remaining_balance),
      new Date(sale.created_at).toLocaleDateString("en-US"),
    ]);

    await generateStyledPDF({
      title: "Sales Invoices History & Revenue Report",
      subtitle: `Total Sales Invoices: ${sales.length}`,
      filename: `Sales_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      metaLeft: [
        `Issued By: TRADESTACK`,
        `Report Type: Sales Activity Statement`,
        `Generated: ${new Date().toLocaleString()}`,
      ],
      metaRight: [
        `Total Invoices: ${sales.length}`,
        `Total Sales Volume: ${formatMoney(totalSales)}`,
        `Total Outstanding Balance: ${formatMoney(totalBalance)}`,
      ],
      tableHeaders,
      tableBody,
      summaryRows: [
        { label: "Total Revenue Volume:", value: formatMoney(totalSales) },
        { label: "Total Outstanding Receivable:", value: formatMoney(totalBalance), bold: true },
      ],
      qrText: `SALES_REPORT|COUNT:${sales.length}|TOTAL:${totalSales}|DATE:${new Date().toISOString()}`,
      termsText: "Sales Invoices Audit & History Statement generated via TradeStack billing engine.",
    });

    message.success("Exported to PDF successfully");
  };

  const columns = [
    {
      title: "Invoice #",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (text, record) => (
        <Tooltip title="Open invoice details">
          <Button
            type="link"
            onClick={() => handleInvoiceView(record.id, record.invoice_source || "sale")}
          >
            <strong>{text}</strong>
          </Button>
        </Tooltip>
      ),
    },
    {
      title: "Customer",
      dataIndex: "shop_name",
      key: "shop_name",
    },
    {
      title: "Total",
      dataIndex: "grand_total",
      key: "grand_total",
      render: (text) => formatMoney(text),
    },
    {
      title: "Paid",
      dataIndex: "payment_received",
      key: "payment_received",
      render: (text) => formatMoney(text),
    },
    {
      title: "Balance",
      dataIndex: "remaining_balance",
      key: "remaining_balance",
      render: (text) => (
        <span style={{ color: text > 0 ? "#ff4d4f" : "#52c41a" }}>
          {formatMoney(text)}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "sale_type",
      key: "sale_type",
      render: (text) => (
        <Tag color={text === "cash" ? "#f50" : "#2db7f5"}>
          {text === "cash" ? "Cash" : "Credit"}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (text) => new Date(text).toLocaleDateString("en-US"),
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="View invoice">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleInvoiceView(record.id, record.invoice_source || "sale")}
            />
          </Tooltip>
          <Tooltip title="Edit sale">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              disabled={record.invoice_source === "purchase" || !isAdmin}
              onClick={() => handleEditSale(record.id)}
            />
          </Tooltip>
          <Tooltip title="Delete sale">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={record.invoice_source === "purchase" || !isAdmin}
              loading={deleteLoading}
              onClick={() => handleDeleteSale(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalSales = sales.reduce(
    (sum, s) => sum + Number(s.grand_total || 0),
    0,
  );
  const totalBalance = sales.reduce(
    (sum, s) => sum + Number(s.remaining_balance || 0),
    0,
  );

  const saleItems = Form.useWatch("items", form) || [];
  const selectedCustomerId = Form.useWatch("customer_id", form);
  const selectedSaleType = Form.useWatch("sale_type", form) || "cash";
  const discountValue = Number(Form.useWatch("discount", form) || 0);
  const paymentValue = Number(Form.useWatch("payment_received", form) || 0);

  const computedTotalAmount = useMemo(() => {
    return saleItems.reduce((sum, item) => {
      const quantity = Number(item?.quantity || 0);
      const unitPrice = Number(item?.unit_price || 0);
      return sum + quantity * unitPrice;
    }, 0);
  }, [saleItems]);

  const computedGrandTotal = useMemo(
    () => Math.max(0, computedTotalAmount - discountValue),
    [computedTotalAmount, discountValue],
  );
  const computedRemaining = useMemo(() => {
    return selectedSaleType === "cash"
      ? 0
      : Math.max(0, computedGrandTotal - paymentValue);
  }, [computedGrandTotal, paymentValue, selectedSaleType]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>
          Sales & Invoice Management
        </Typography.Title>
      </div>

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
              gap: 12,
              flex: "1 1 620px",
              flexWrap: "wrap",
            }}
          >
            <Input.Search
              allowClear
              placeholder="Search invoices or customers"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={searchSales}
              style={{ flex: "1 1 240px", minWidth: 220 }}
            />
            <Select
              allowClear
              placeholder={isInvoicePage && activeInvoiceType === "purchase" ? "Purchase Type" : "Sale Type"}
              style={{ flex: "1 1 160px", minWidth: 150 }}
              value={saleTypeFilter}
              onChange={(value) => setSaleTypeFilter(value)}
              options={[
                { label: "Cash", value: "cash" },
                { label: "Credit", value: "credit" },
              ]}
            />
            {isInvoicePage && (
              <Select
                value={activeInvoiceType}
                onChange={(value) => {
                  setInvoiceTypeFilter(value);
                  setSaleTypeFilter(undefined);
                }}
                style={{ flex: "1 1 170px", minWidth: 170 }}
                options={[
                  { label: "Sale Invoices", value: "sale" },
                  ...(isAdmin || isVendor ? [{ label: "Purchase Invoices", value: "purchase" }] : []),
                ]}
              />
            )}
            <DatePicker.RangePicker
              style={{ flex: "1 1 260px", minWidth: 240 }}
              value={dateRange}
              onChange={setDateRange}
            />
            <Space wrap={false}>
              <Tooltip title="Apply sales filters">
                <Button type="primary" onClick={searchSales}>
                  Apply
                </Button>
              </Tooltip>
              <Tooltip title="Clear sales filters">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSaleTypeFilter(undefined);
                    setDateRange([]);
                    fetchData();
                  }}
                >
                  Reset
                </Button>
              </Tooltip>
            </Space>
          </div>
          <Space wrap style={{ justifyContent: "flex-end" }}>
            {isAdmin && !location.pathname.startsWith("/invoices") && (
              <Tooltip title="Create a new sale">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenSaleDrawer}
                >
                  Create Sale
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Export visible sales to Excel">
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                type="primary"
              >
                Excel Export
              </Button>
            </Tooltip>
            <Tooltip title="Export visible sales to PDF">
              <Button icon={<FilePdfOutlined />} danger onClick={exportToPDF}>
                PDF Export
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Sales"
              value={sales.length}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Amount"
              value={totalSales}
              prefix="Rs. "
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
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

      <Card>
        <Spin spinning={pageLoading}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={sales.map((sale, idx) => ({
              ...sale,
              key: sale.id || idx,
            }))}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            bordered
            sticky
            className="papertech-table-wrapper"
          />
        </Spin>
      </Card>

      <Modal
        title={editingSale ? "Edit Sale" : "Create Sale"}
        open={drawerOpen}
        onCancel={() => {
          setDrawerOpen(false);
          setEditingSale(null);
          form.resetFields();
        }}
        centered
        width={720}
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
                setDrawerOpen(false);
                setEditingSale(null);
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
              {editingSale ? "Update Sale" : "Save Sale"}
            </Button>
          </>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" style={{ marginTop: "8px" }}>
          <Form.Item name="customer_id" label="Select Customer (optional)">
            <Select
              allowClear
              size="large"
              placeholder="Select or leave blank for walk-in"
              options={customers.map((c) => ({
                label: `${c.shop_name} (${c.full_name})`,
                value: c.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="sale_type"
            label="Sale Type"
            initialValue="cash"
            rules={[{ required: true, message: "Sale type is required" }]}
          >
            <Select
              size="large"
              options={[
                { label: "Cash", value: "cash" },
                {
                  label: "Credit",
                  value: "credit",
                  disabled: !selectedCustomerId,
                },
              ]}
            />
          </Form.Item>

          <Typography.Title level={5}>Add Items</Typography.Title>
          <Card style={{ marginBottom: 16, background: "#fafafa" }}>
            <Row gutter={16}>
              <Col span={8}>
                <Typography.Text type="secondary">Total Amount</Typography.Text>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {formatMoney(computedTotalAmount)}
                </div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">Grand Total</Typography.Text>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {formatMoney(computedGrandTotal)}
                </div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">Remaining</Typography.Text>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: computedRemaining > 0 ? "#ff4d4f" : "#52c41a",
                  }}
                >
                  {formatMoney(computedRemaining)}
                </div>
              </Col>
            </Row>
          </Card>

          <Form.List
            name="items"
            initialValue={[{ product_id: null, quantity: 1, unit_price: 0, quantity_unit: "pack" }]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card key={field.key} style={{ marginBottom: 12 }}>
                    <Row gutter={16} align="middle">
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, "product_id"]}
                          fieldKey={[field.fieldKey, "product_id"]}
                          label="Product"
                          rules={[{ required: true, message: "Select a product" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder="Select a product"
                            options={products.map((p) => ({
                              label: `${p.name} (Stock: ${p.current_stock})`,
                              value: p.id,
                            }))}
                            onChange={(value) => {
                              const selected = products.find((p) => p.id === value);
                              if (selected) {
                                form.setFieldValue(
                                  ["items", field.name, "unit_price"],
                                  Number(selected.sale_price || 0),
                                );
                                form.setFieldValue(
                                  ["items", field.name, "quantity_unit"],
                                  "pack",
                                );
                                form.validateFields([
                                  ["items", field.name, "unit_price"],
                                ]);
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...field}
                          name={[field.name, "quantity"]}
                          fieldKey={[field.fieldKey, "quantity"]}
                          label="Quantity"
                          rules={[
                            { required: true, type: "number", min: 1, message: "Enter quantity" },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...field}
                          name={[field.name, "quantity_unit"]}
                          fieldKey={[field.fieldKey, "quantity_unit"]}
                          label="Unit"
                          initialValue="pack"
                          rules={[{ required: true, message: "Select unit" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            options={[
                              { label: "Pack/Rim", value: "pack" },
                              { label: "Sheets", value: "sheet" },
                            ]}
                            onChange={(value) => {
                              const productId = form.getFieldValue([
                                "items",
                                field.name,
                                "product_id",
                              ]);
                              const selected = products.find((p) => p.id === productId);
                              if (!selected) return;
                              if (value === "sheet") {
                                form.setFieldValue(
                                  ["items", field.name, "unit_price"],
                                  Number(selected.sale_price || 0) / getSheetsPerPack(selected),
                                );
                              } else {
                                form.setFieldValue(
                                  ["items", field.name, "unit_price"],
                                  Number(selected.sale_price || 0),
                                );
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...field}
                          name={[field.name, "unit_price"]}
                          fieldKey={[field.fieldKey, "unit_price"]}
                          label="Price"
                          rules={[
                            { required: true, type: "number", min: 0, message: "Enter unit price" },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0} style={{ width: "100%" }} />
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
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item>
                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => add({ product_id: null, quantity: 1, unit_price: 0, quantity_unit: "pack" })}
                      >
                        Add Item
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </Form.List>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="discount" label="Discount" initialValue={0}>
                <InputNumber min={0} style={{ width: "100%" }} size="large" placeholder="e.g.: 500" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_received" label="Payment Received" initialValue={0}>
                <InputNumber min={0} style={{ width: "100%" }} size="large" placeholder="e.g.: 5000" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

export default SalesHistory;
