import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Typography, Table, Button, Space, message, Spin, Descriptions } from "antd";
import { ArrowLeftOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import api from "../../services/apiClient";
import { downloadInvoicePDF, previewInvoice } from "../../services/pdfDownloadService";

const formatMoney = (value) => `Rs. ${Number(value ?? 0).toFixed(2)}`;

function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const invoiceSource = location.state?.invoiceSource === "purchase" ? "purchase" : "sale";

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        if (invoiceSource === "purchase") {
          const response = await api.get(`/purchases/${id}`);
          setInvoice({ ...response.data.data.purchase, invoice_source: "purchase" });
          setItems(response.data.data.items || []);
        } else {
          const response = await api.get(`/sales/${id}`);
          setInvoice({ ...response.data.data.sale, invoice_source: "sale" });
          setItems(response.data.data.items || []);
        }
      } catch (error) {
        message.error(error.response?.data?.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, invoiceSource]);

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      setDownloading(true);
      const invoiceNum = invoice.invoice_number || invoice.purchase_number || `INV-${invoice.id}`;
      await downloadInvoicePDF(
        invoiceSource,
        invoice.id,
        `Invoice_${invoiceNum}.pdf`
      );
      message.success("PDF downloaded successfully!");
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = () => {
    if (!invoice) return;
    try {
      previewInvoice(invoiceSource, invoice.id);
    } catch (error) {
      message.error("Failed to preview invoice");
    }
  };

  const handlePrint = () => {
    if (!invoice) return;
    try {
      previewInvoice(invoiceSource, invoice.id);
      message.info("Invoice opened in new tab. Use Ctrl+P to print.");
    } catch (error) {
      message.error("Failed to open invoice for printing");
    }
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product_name",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Unit Price",
      dataIndex: "unit_price",
      key: "unit_price",
      render: (value) => formatMoney(value),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (value) => formatMoney(value),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 24 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Typography.Title level={2}>Invoice Details</Typography.Title>
          <Space>
            <Button 
              icon={<DownloadOutlined />} 
              type="primary" 
              onClick={handleDownloadPDF}
              loading={downloading}
            >
              Download PDF
            </Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print
            </Button>
          </Space>
        </Space>
      </div>

      {invoice ? (
        <>
          <Card style={{ marginBottom: 24 }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Invoice #">{invoice.invoice_number || invoice.purchase_number}</Descriptions.Item>
              <Descriptions.Item label={invoiceSource === "purchase" ? "Vendor" : "Customer"}>
                {invoice.company_name || invoice.shop_name || invoice.full_name || "Walk-in Customer"}
              </Descriptions.Item>
              <Descriptions.Item label={invoiceSource === "purchase" ? "Vendor Phone" : "Customer Phone"}>
                {invoice.phone || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={invoiceSource === "purchase" ? "Purchase Type" : "Sale Type"}>
                {(invoiceSource === "purchase" ? invoice.purchase_type : invoice.sale_type) === "cash" ? "Cash" : "Credit"}
              </Descriptions.Item>
              <Descriptions.Item label="Date">{new Date(invoice.created_at).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ marginBottom: 24 }}>
            <Table
              columns={columns}
              dataSource={items}
              rowKey={(record) => record.id}
              pagination={false}
              sticky
              className="papertech-table-wrapper"
            />
          </Card>

          <Card>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Total Amount">{formatMoney(invoice.total_amount)}</Descriptions.Item>
              <Descriptions.Item label="Discount">{formatMoney(invoice.discount)}</Descriptions.Item>
              <Descriptions.Item label="Grand Total">{formatMoney(invoice.grand_total)}</Descriptions.Item>
              <Descriptions.Item label={invoiceSource === "purchase" ? "Payment Paid" : "Payment Received"}>
                {formatMoney(invoiceSource === "purchase" ? invoice.payment_paid : invoice.payment_received)}
              </Descriptions.Item>
              <Descriptions.Item label="Remaining Balance">{formatMoney(invoice.remaining_balance)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      ) : (
        <Card>Invoice not found or still loading.</Card>
      )}
    </Spin>
  );
}

export default InvoiceDetails;
