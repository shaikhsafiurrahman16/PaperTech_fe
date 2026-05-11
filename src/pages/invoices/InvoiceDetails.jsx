import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Typography, Table, Button, Space, message, Spin, Descriptions } from "antd";
import { ArrowLeftOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import api from "../../api/axiosConfig";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatMoney = (value) => `Rs. ${Number(value ?? 0).toFixed(2)}`;

function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/sales/${id}`);
        setSale(response.data.data.sale);
        setItems(response.data.data.items || []);
      } catch (error) {
        message.error(error.response?.data?.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  const downloadInvoicePDF = () => {
    if (!sale) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("PAPERTECH", 14, 20);
    doc.setFontSize(12);
    doc.text("Invoice", 14, 28);
    doc.setFontSize(9);
    doc.text(`Invoice #: ${sale.invoice_number}`, 14, 36);
    doc.text(`Date: ${new Date(sale.created_at).toLocaleString()}`, 14, 42);
    doc.text(`Customer: ${sale.shop_name || sale.full_name || 'Walk-in Customer'}`, 14, 48);

    const tableData = items.map((item) => [
      item.product_name,
      item.quantity,
      `Rs. ${Number(item.unit_price).toFixed(2)}`,
      `Rs. ${Number(item.subtotal).toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [["Product", "Qty", "Unit Price", "Subtotal"]],
      body: tableData,
      startY: 58,
      margin: 10,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 85, 135] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Discount: Rs. ${Number(sale.discount).toFixed(2)}`, 14, finalY);
    doc.text(`Grand Total: Rs. ${Number(sale.grand_total).toFixed(2)}`, 14, finalY + 6);
    doc.text(`Payment Received: Rs. ${Number(sale.payment_received).toFixed(2)}`, 14, finalY + 12);
    doc.text(`Remaining Balance: Rs. ${Number(sale.remaining_balance).toFixed(2)}`, 14, finalY + 18);
    doc.text(`Sale Type: ${sale.sale_type === 'cash' ? 'Cash' : 'Credit'}`, 14, finalY + 24);

    doc.save(`Invoice_${sale.invoice_number}.pdf`);
  };

  const printInvoice = () => {
    window.print();
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
            <Button icon={<DownloadOutlined />} type="primary" onClick={downloadInvoicePDF}>
              Download PDF
            </Button>
            <Button icon={<PrinterOutlined />} onClick={printInvoice}>
              Print
            </Button>
          </Space>
        </Space>
      </div>

      {sale ? (
        <>
          <Card style={{ marginBottom: 24 }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Invoice #">{sale.invoice_number}</Descriptions.Item>
              <Descriptions.Item label="Customer">{sale.shop_name || sale.full_name || 'Walk-in Customer'}</Descriptions.Item>
              <Descriptions.Item label="Customer Phone">{sale.phone || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Sale Type">{sale.sale_type === 'cash' ? 'Cash' : 'Credit'}</Descriptions.Item>
              <Descriptions.Item label="Date">{new Date(sale.created_at).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ marginBottom: 24 }}>
            <Table
              columns={columns}
              dataSource={items}
              rowKey={(record) => record.id}
              pagination={false}
            />
          </Card>

          <Card>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Total Amount">{formatMoney(sale.total_amount)}</Descriptions.Item>
              <Descriptions.Item label="Discount">{formatMoney(sale.discount)}</Descriptions.Item>
              <Descriptions.Item label="Grand Total">{formatMoney(sale.grand_total)}</Descriptions.Item>
              <Descriptions.Item label="Payment Received">{formatMoney(sale.payment_received)}</Descriptions.Item>
              <Descriptions.Item label="Remaining Balance">{formatMoney(sale.remaining_balance)}</Descriptions.Item>
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
