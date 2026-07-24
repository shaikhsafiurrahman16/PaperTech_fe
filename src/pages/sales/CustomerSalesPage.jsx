import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Row, Col, Card, Statistic, Spin, Empty, Tooltip } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, PrinterOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/apiClient';
import { useSelector } from 'react-redux';

const formatMoney = value => `Rs. ${Number(value ?? 0).toFixed(2)}`;

function CustomerSalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector(state => state.auth);
  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    fetchSales();
    fetchCustomerInfo();
  }, []);

  const fetchCustomerInfo = async () => {
    try {
      const response = await api.get(`customers/${user?.id}`);
      if (response.data.success) {
        setCustomerInfo(response.data.data);
      }
    } catch (error) {
      console.log('Failed to load customer info');
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sales');
      setSales(response.data.data || []);
    } catch (error) {
      message.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (sales.length === 0) {
      message.warning('No data available to export');
      return;
    }

    const data = sales.map(sale => ({
      'Invoice Number': sale.invoice_number,
      'Total Amount': sale.total_amount,
      'Discount': sale.discount,
      'Grand Total': sale.grand_total,
      'Payment Received': sale.payment_received,
      'Balance': sale.remaining_balance,
      'Type': sale.sale_type,
      'Date': new Date(sale.created_at).toLocaleDateString('en-US'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('Exported to Excel successfully');
  };

  const exportToPDF = () => {
    if (sales.length === 0) {
      message.warning('No data available to export');
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.text('TRADESTACK - Sales Report', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Customer: ${user?.full_name || user?.username}`, 14, 28);
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')}`, 14, 34);
    
    const tableData = sales.map(sale => [
      sale.invoice_number,
      formatMoney(sale.total_amount),
      formatMoney(sale.discount),
      formatMoney(sale.grand_total),
      formatMoney(sale.payment_received),
      formatMoney(sale.remaining_balance),
      sale.sale_type,
      new Date(sale.created_at).toLocaleDateString('en-US'),
    ]);

    autoTable(doc, {
      head: [['Invoice', 'Total', 'Discount', 'Grand Total', 'Paid', 'Balance', 'Type', 'Date']],
      body: tableData,
      startY: 42,
      margin: 10,
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
    });

    doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    message.success('Exported to PDF successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const salesColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      width: 120,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (text) => formatMoney(text),
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      width: 100,
      render: (text) => formatMoney(text),
    },
    {
      title: 'Grand Total',
      dataIndex: 'grand_total',
      key: 'grand_total',
      width: 110,
      render: (text) => <strong style={{ color: '#1890ff' }}>{formatMoney(text)}</strong>,
    },
    {
      title: 'Payment',
      dataIndex: 'payment_received',
      key: 'payment_received',
      width: 100,
      render: (text) => formatMoney(text),
    },
    {
      title: 'Balance',
      dataIndex: 'remaining_balance',
      key: 'remaining_balance',
      width: 100,
      render: (text) => <span style={{ color: text > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>{formatMoney(text)}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'sale_type',
      key: 'sale_type',
      width: 80,
      render: (text) => (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px',
          background: text === 'cash' ? '#f6ffed' : '#e6f7ff',
          color: text === 'cash' ? '#52c41a' : '#1890ff'
        }}>
          {text === 'cash' ? 'Cash' : 'Credit'}
        </span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (text) => new Date(text).toLocaleDateString('en-US'),
    },
  ];

  const totalSalesAmount = sales.reduce((sum, s) => sum + Number(s.grand_total || 0), 0);
  const totalPaid = sales.reduce((sum, s) => sum + Number(s.payment_received || 0), 0);
  const totalBalance = sales.reduce((sum, s) => sum + Number(s.remaining_balance || 0), 0);

  return (
    <div style={{ paddingBottom: 32 }}>
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Welcome</div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{user?.full_name || user?.username}</div>
            </div>
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
            {customerInfo && (
              <div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Available Credit</div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>{formatMoney(customerInfo.credit_limit)}</div>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Sales" 
              value={sales.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Amount" 
              value={totalSalesAmount}
              prefix="Rs. "
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Payment" 
              value={totalPaid}
              prefix="Rs. "
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="Total Balance" 
              value={totalBalance}
              prefix="Rs. "
              valueStyle={{ color: totalBalance > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Tooltip title="Export all your sales to Excel">
            <Button 
              icon={<FileExcelOutlined />} 
              onClick={exportToExcel}
              type="primary"
            >
              Excel Export
            </Button>
          </Tooltip>
          <Tooltip title="Export all your sales to PDF">
            <Button 
              icon={<FilePdfOutlined />} 
              onClick={exportToPDF}
              type="primary"
              danger
            >
              PDF Export
            </Button>
          </Tooltip>
          <Tooltip title="Print your sales">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
            >
              Print
            </Button>
          </Tooltip>
        </Space>
      </Card>

      <Card>
        <Spin spinning={loading}>
          {sales.length === 0 ? (
            <Empty 
              description="No sales found" 
              style={{ marginTop: 48, marginBottom: 48 }}
            />
          ) : (
            <Table
              columns={salesColumns}
              dataSource={sales.map((sale, idx) => ({ ...sale, key: sale.id || idx }))}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 1000 }}
              bordered
            />
          )}
        </Spin>
      </Card>

      <Card style={{ marginTop: 24, background: '#e6f7ff' }}>
        <Row>
          <Col span={24}>
            <div style={{ color: '#0050b3' }}>
              <strong>Note:</strong> This page only shows your past sales. You cannot create a new sale here. Please ask the admin to add sales.
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default CustomerSalesPage;
