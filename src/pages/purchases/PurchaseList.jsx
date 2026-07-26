import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { EditOutlined, MinusCircleOutlined, PlusOutlined, DownloadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import api from "../../services/apiClient";
import usePermissions from "../../hooks/usePermissions";
import { downloadInvoicePDF } from "../../services/pdfDownloadService";

const formatMoney = (value) => `Rs. ${Number(value ?? 0).toFixed(2)}`;
const getSheetsPerPack = (product) => Number(product?.sheets_per_pack || 1) || 1;

function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState();
  const [dateRange, setDateRange] = useState([]);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [form] = Form.useForm();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin" || user?.role === "company_user";
  const { canCreate, canUpdate } = usePermissions("purchases");

  const fetchData = async (filters = {}) => {
    try {
      setPageLoading(true);
      const requests = [api.get("/purchases", { params: filters })];
      if (isAdmin && (canCreate || canUpdate)) {
        requests.push(api.get("/vendors"));
        requests.push(api.get("/products"));
      }
      const responses = await Promise.all(requests);
      const purchasesRes = responses[0];
      setPurchases(purchasesRes.data.data || []);
      if (isAdmin && (canCreate || canUpdate)) {
        setVendors(responses[1].data.data || []);
        setProducts(responses[2].data.data || []);
      } else {
        setVendors([]);
        setProducts([]);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to load purchases");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, canCreate, canUpdate]);

  const applyFilters = () => {
    fetchData({
      search: searchTerm || undefined,
      purchase_type: purchaseTypeFilter || undefined,
      from_date: dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
      to_date: dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
    });
  };

  const items = Form.useWatch("items", form) || [];
  const purchaseType = Form.useWatch("purchase_type", form) || "cash";
  const discount = Number(Form.useWatch("discount", form) || 0);
  const paymentPaid = Number(Form.useWatch("payment_paid", form) || 0);

  const computedTotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = Number(item?.quantity || 0);
        const unitPrice = Number(item?.unit_price || 0);
        return sum + qty * unitPrice;
      }, 0),
    [items],
  );
  const computedGrandTotal = Math.max(0, computedTotal - discount);
  const computedRemaining =
    purchaseType === "cash"
      ? 0
      : Math.max(0, computedGrandTotal - paymentPaid);

  const onFinish = async (values) => {
    try {
      setSaving(true);
      if (editingPurchase) {
        await api.put(`/purchases/${editingPurchase.id}`, {
          purchase_type: values.purchase_type,
          discount: Number(values.discount || 0),
          payment_paid: Number(values.payment_paid || 0),
        });
        message.success("Purchase updated successfully");
        setDrawerOpen(false);
        setEditingPurchase(null);
        form.resetFields();
        fetchData();
        return;
      }

      const productMap = new Map(products.map((product) => [Number(product.id), product]));
      await api.post("/purchases", {
        vendor_id: Number(values.vendor_id),
        purchase_type: values.purchase_type,
        discount: Number(values.discount || 0),
        payment_paid: Number(values.payment_paid || 0),
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
      });
      message.success("Purchase saved successfully");
      setDrawerOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save purchase");
    } finally {
      setSaving(false);
    }
  };

  const totalPayable = purchases.reduce(
    (sum, p) => sum + Number(p.remaining_balance || 0),
    0,
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={2}>Purchases</Typography.Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Total Purchases" value={purchases.length} valueStyle={{ color: "#1890ff" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Total Amount" value={purchases.reduce((s, p) => s + Number(p.grand_total || 0), 0)} prefix="Rs. " valueStyle={{ color: "#52c41a" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic title="Total Payable" value={totalPayable} prefix="Rs. " valueStyle={{ color: totalPayable > 0 ? "#ff4d4f" : "#52c41a" }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Input.Search
            allowClear
            placeholder="Search purchase/vendor"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onSearch={applyFilters}
            style={{ flex: "1 1 260px", minWidth: 220 }}
          />
          <Select
            allowClear
            placeholder="Purchase type"
            value={purchaseTypeFilter}
            onChange={setPurchaseTypeFilter}
            options={[
              { label: "Cash", value: "cash" },
              { label: "Credit", value: "credit" },
            ]}
            style={{ width: 160 }}
          />
          <DatePicker.RangePicker value={dateRange} onChange={setDateRange} />
          <Space>
            <Button type="primary" onClick={applyFilters}>Apply</Button>
            <Button
              onClick={() => {
                setSearchTerm("");
                setPurchaseTypeFilter(undefined);
                setDateRange([]);
                fetchData();
              }}
            >
              Reset
            </Button>
          </Space>
          {isAdmin && canCreate && (
            <div style={{ marginLeft: "auto" }}>
              <Tooltip title="Create new purchase">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingPurchase(null);
                    form.resetFields();
                    form.setFieldsValue({
                      purchase_type: "cash",
                      discount: 0,
                      payment_paid: 0,
                      items: [{ product_id: null, quantity: 1, unit_price: 0, quantity_unit: "pack" }],
                    });
                    setDrawerOpen(true);
                  }}
                >
                  New Purchase
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <Spin spinning={pageLoading}>
          <Table
            rowKey="id"
            bordered
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            columns={[
              { title: "Purchase #", dataIndex: "purchase_number", key: "purchase_number" },
              { title: "Vendor", dataIndex: "company_name", key: "company_name" },
              { title: "Total", dataIndex: "grand_total", key: "grand_total", render: (value) => formatMoney(value) },
              { title: "Paid", dataIndex: "payment_paid", key: "payment_paid", render: (value) => formatMoney(value) },
              {
                title: "Remaining",
                dataIndex: "remaining_balance",
                key: "remaining_balance",
                render: (value) => (
                  <span style={{ color: Number(value) > 0 ? "#ff4d4f" : "#52c41a" }}>
                    {formatMoney(value)}
                  </span>
                ),
              },
              {
                title: "Type",
                dataIndex: "purchase_type",
                key: "purchase_type",
                render: (value) => <Tag color={value === "cash" ? "blue" : "orange"}>{value}</Tag>,
              },
              {
                title: "Date",
                dataIndex: "created_at",
                key: "created_at",
                render: (value) => new Date(value).toLocaleDateString("en-US"),
              },
              ...(isAdmin && canUpdate ? [{
                title: "Action",
                key: "action",
                width: 120,
                fixed: "right",
                render: (_, record) => (
                  <Space size="small">
                    <Tooltip title="Download PDF">
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        size="small"
                        onClick={async () => {
                          try {
                            const invoiceNum = record.purchase_number || `PUR-${record.id}`;
                            await downloadInvoicePDF('purchase', record.id, `Purchase_${invoiceNum}.pdf`);
                            message.success("PDF downloaded successfully!");
                          } catch (error) {
                            message.error(error.response?.data?.message || "Failed to download PDF");
                          }
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Update purchase">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={async () => {
                          try {
                            setSaving(true);
                            const response = await api.get(`/purchases/${record.id}`);
                            const purchase = response.data.data?.purchase;
                            if (!purchase) return;
                            setEditingPurchase(purchase);
                            form.resetFields();
                            form.setFieldsValue({
                              vendor_id: purchase.vendor_id,
                              purchase_type: purchase.purchase_type,
                              discount: Number(purchase.discount || 0),
                              payment_paid: Number(purchase.payment_paid || 0),
                              items: (response.data.data?.items || []).map((item) => ({
                                product_id: item.product_id,
                                quantity: item.quantity,
                                quantity_unit: "sheet",
                                unit_price: Number(item.unit_price || 0),
                              })),
                            });
                            setDrawerOpen(true);
                          } catch (error) {
                            message.error(error.response?.data?.message || "Failed to load purchase details");
                          } finally {
                            setSaving(false);
                          }
                        }}
                      />
                    </Tooltip>
                  </Space>
                ),
              }] : []),
            ]}
            dataSource={purchases}
          />
        </Spin>
      </Card>

      <Modal
        title={editingPurchase ? `Update Purchase ${editingPurchase.purchase_number}` : "Create Purchase"}
        open={drawerOpen}
        onCancel={() => {
          setDrawerOpen(false);
          setEditingPurchase(null);
          form.resetFields();
        }}
        centered
        width={760}
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
                setEditingPurchase(null);
              }}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={saving}
              size="large"
              onClick={() => form.submit()}
            >
              {editingPurchase ? "Update Purchase" : "Save Purchase"}
            </Button>
          </>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" style={{ marginTop: "8px" }}>
          <Form.Item
            name="vendor_id"
            label="Vendor"
            rules={[{ required: true, message: "Please select vendor" }]}
          >
            <Select
              showSearch
              placeholder="Select vendor"
              disabled={!!editingPurchase}
              optionFilterProp="label"
              size="large"
              options={vendors.map((vendor) => ({
                label: `${vendor.company_name} (${vendor.full_name})`,
                value: vendor.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="purchase_type"
            label="Purchase Type"
            rules={[{ required: true, message: "Select purchase type" }]}
          >
            <Select
              size="large"
              placeholder="Select type"
              options={[
                { label: "Cash", value: "cash" },
                { label: "Credit", value: "credit" },
              ]}
            />
          </Form.Item>

          <Typography.Title level={5}>Items</Typography.Title>
          <Card style={{ marginBottom: 16, background: "#fafafa" }}>
            <Row gutter={16}>
              <Col span={8}>
                <Typography.Text type="secondary">Total</Typography.Text>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{formatMoney(computedTotal)}</div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">Grand Total</Typography.Text>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{formatMoney(computedGrandTotal)}</div>
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">Remaining</Typography.Text>
                <div style={{ fontSize: 18, fontWeight: 600, color: computedRemaining > 0 ? "#ff4d4f" : "#52c41a" }}>
                  {formatMoney(computedRemaining)}
                </div>
              </Col>
            </Row>
          </Card>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card key={field.key} style={{ marginBottom: 12 }}>
                    <Row gutter={16} align="middle">
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, "product_id"]}
                          label="Product"
                          rules={[{ required: true, message: "Select product" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            disabled={!!editingPurchase}
                            placeholder="Select product"
                            options={products.map((product) => ({
                              label: `${product.name} (Stock: ${product.current_stock})`,
                              value: product.id,
                            }))}
                            onChange={(value) => {
                              const selected = products.find((product) => product.id === value);
                              if (selected) {
                                form.setFieldValue(["items", field.name, "unit_price"], Number(selected.cost_price || 0));
                                form.setFieldValue(["items", field.name, "quantity_unit"], "pack");
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...field}
                          name={[field.name, "quantity"]}
                          label="Qty"
                          rules={[{ required: true, type: "number", min: 1, message: "Qty required" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber disabled={!!editingPurchase} min={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...field}
                          name={[field.name, "quantity_unit"]}
                          label="Unit"
                          initialValue="pack"
                          rules={[{ required: true, message: "Select unit" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            disabled={!!editingPurchase}
                            options={[
                              { label: "Pack/Rim", value: "pack" },
                              { label: "Sheets", value: "sheet" },
                            ]}
                            onChange={(value) => {
                              const productId = form.getFieldValue(["items", field.name, "product_id"]);
                              const selected = products.find((product) => product.id === productId);
                              if (!selected) {
                                return;
                              }
                              if (value === "sheet") {
                                form.setFieldValue(
                                  ["items", field.name, "unit_price"],
                                  Number(selected.cost_price || 0) / getSheetsPerPack(selected),
                                );
                              } else {
                                form.setFieldValue(
                                  ["items", field.name, "unit_price"],
                                  Number(selected.cost_price || 0),
                                );
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...field}
                          name={[field.name, "unit_price"]}
                          label="Price"
                          rules={[{ required: true, type: "number", min: 0, message: "Unit price required" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber disabled={!!editingPurchase} min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button danger type="text" icon={<MinusCircleOutlined />} disabled={!!editingPurchase} onClick={() => remove(field.name)} />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item>
                      <Button disabled={!!editingPurchase} type="dashed" block icon={<PlusOutlined />} onClick={() => add({ product_id: null, quantity: 1, unit_price: 0, quantity_unit: "pack" })}>
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
              <Form.Item name="payment_paid" label="Payment Paid" initialValue={0}>
                <InputNumber min={0} style={{ width: "100%" }} size="large" placeholder="e.g.: 10000" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

export default PurchaseList;
