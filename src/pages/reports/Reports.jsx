import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Typography, message, Statistic, Spin, Tag, Space, Button, DatePicker, Form, Tooltip } from 'antd';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axiosConfig';

const formatMoney = value => `Rs. ${Number(value ?? 0).toFixed(2)}`;
const { RangePicker } = DatePicker;

function Reports() {
  const [summary, setSummary] = useState({});
  const [stock, setStock] = useState([]);
  const [balances, setBalances] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [filterForm] = Form.useForm();

  const loadReports = async (nextFilters = filters) => {
      try {
        setLoading(true);
        const params = { ...nextFilters };
        const [summaryRes, stockRes, balancesRes, monthlyRes] = await Promise.all([
          api.get('/reports/dashboard', { params }),
          api.get('/reports/stock'),
          api.get('/reports/outstanding-balances', { params }),
          api.get('/reports/monthly-sales', { params }),
        ]);
        setSummary(summaryRes.data.data || {});
        setStock(stockRes.data.data || []);
        setBalances(balancesRes.data.data || []);
        setMonthlySales(monthlyRes.data.data || []);
      } catch (error) {
        message.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      { Metric: 'Total Sales', Value: summary.total_sales || 0 },
      { Metric: 'Total Customers', Value: summary.total_customers || 0 },
      { Metric: 'Total Stock', Value: summary.total_stock || 0 },
      { Metric: 'Pending Payments', Value: summary.total_pending_payments || 0 },
      { Metric: 'Low Stock Alerts', Value: summary.low_stock_alerts || 0 },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Stock sheet
    const stockData = stock.map(p => ({
      'Product': p.name,
      'Type': p.product_type,
      'Current Stock': p.current_stock,
      'Alert Level': p.min_stock_alert,
    }));
    const stockSheet = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, stockSheet, 'Stock');

    // Balances sheet
    const balancesData = balances.map(c => ({
      'Shop': c.shop_name,
      'Customer': c.full_name,
      'Balance': formatMoney(c.current_balance),
    }));
    const balancesSheet = XLSX.utils.json_to_sheet(balancesData);
    XLSX.utils.book_append_sheet(wb, balancesSheet, 'Balances');

    XLSX.writeFile(wb, `Complete_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('Exported to Excel successfully');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('PAPERTECH - Complete Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-US')}`, 14, 28);

    let yPosition = 40;

    // Summary section
    doc.setFontSize(12);
    doc.text('Summary', 14, yPosition);
    yPosition += 8;

    const summaryData = [
      ['Total Sales', summary.total_sales || 0],
      ['Total Customers', summary.total_customers || 0],
      ['Total Stock', summary.total_stock || 0],
      ['Pending Payments', summary.total_pending_payments || 0],
    ];

    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: summaryData,
      startY: yPosition,
      margin: 10,
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Stock section
    doc.setFontSize(12);
    doc.text('Low Stock Products', 14, yPosition);
    yPosition += 8;

    const lowStockData = stock.filter(p => p.current_stock <= p.min_stock_alert).map(p => [
      p.name,
      p.current_stock,
      p.min_stock_alert,
    ]);

    if (lowStockData.length > 0) {
      autoTable(doc, {
        head: [['Product', 'Current Stock', 'Alert Level']],
        body: lowStockData,
        startY: yPosition,
        margin: 10,
      });
    }

    doc.save(`Complete_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    message.success('Exported to PDF successfully');
  };

  const lowStockCount = stock.filter(p => p.current_stock <= p.min_stock_alert).length;

  return (
    <Spin spinning={loading}>
      <div>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Title level={2} style={{ margin: 0 }}>Reports</Typography.Title>
          <Space wrap>
            <Tooltip title="Export report data to Excel">
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                type="primary"
              >
                Export All Excel
              </Button>
            </Tooltip>
            <Tooltip title="Export report data to PDF">
              <Button
                icon={<FilePdfOutlined />}
                danger
                onClick={exportToPDF}
              >
                Export All PDF
              </Button>
            </Tooltip>
          </Space>
        </div>

        <Card style={{ marginBottom: 24 }}>
          <Form
            form={filterForm}
            layout="vertical"
            onFinish={(values) => {
              const nextFilters = {
                from_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
                to_date: values.date_range?.[1]?.format('YYYY-MM-DD'),
              };
              setFilters(nextFilters);
              loadReports(nextFilters);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, justifyContent: 'space-evenly', flexWrap: 'nowrap' }}>
              <div style={{ flex: '1 1 360px' }}>
                <Form.Item name="date_range" label="Report Date Range" style={{ marginBottom: 0 }}>
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </div>
              <div style={{ flex: '0 0 auto' }}>
                <Space wrap={false}>
                  <Tooltip title="Apply report date range">
                    <Button type="primary" htmlType="submit">
                      Apply
                    </Button>
                  </Tooltip>
                  <Tooltip title="Clear report date range">
                    <Button
                      onClick={() => {
                        filterForm.resetFields();
                        setFilters({});
                        loadReports({});
                      }}
                    >
                      Reset
                    </Button>
                  </Tooltip>
                </Space>
              </div>
            </div>
          </Form>
        </Card>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Sales"
                value={summary.total_sales || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Customers"
                value={summary.total_customers || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Pending Payments"
                value={summary.total_pending_payments || 0}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Low Stock Products"
                value={lowStockCount}
                valueStyle={{ color: lowStockCount > 0 ? '#ff9c6e' : '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Stock Report */}
        <Card title="Stock Status Report" style={{ marginBottom: 24 }}>
          <Table
            columns={[
              {
                title: 'Product',
                dataIndex: 'name',
                key: 'name',
                render: (text) => <strong>{text}</strong>
              },
              {
                title: 'Type',
                dataIndex: 'product_type',
                key: 'product_type'
              },
              {
                title: 'Current Stock',
                dataIndex: 'current_stock',
                key: 'current_stock'
              },
              {
                title: 'Alert Level',
                dataIndex: 'min_stock_alert',
                key: 'min_stock_alert'
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, record) => (
                  <Tag color={record.current_stock <= record.min_stock_alert ? 'red' : 'green'}>
                    {record.current_stock <= record.min_stock_alert ? 'Low' : 'OK'}
                  </Tag>
                )
              }
            ]}
            dataSource={stock.map((s, idx) => ({ ...s, key: s.id || idx }))}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            bordered
          />
        </Card>

        {/* Outstanding Balances */}
        <Card title="Outstanding Balances" style={{ marginBottom: 24 }}>
          <Table
            columns={[
              {
                title: 'Shop',
                dataIndex: 'shop_name',
                key: 'shop_name',
                render: (text) => <strong>{text}</strong>
              },
              {
                title: 'Owner',
                dataIndex: 'full_name',
                key: 'full_name'
              },
              {
                title: 'Balance',
                dataIndex: 'current_balance',
                key: 'current_balance',
                render: (text) => <span style={{ color: text > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>{formatMoney(text)}</span>
              }
            ]}
            dataSource={balances.map((b, idx) => ({ ...b, key: b.id || idx }))}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            bordered
          />
        </Card>

        {/* Monthly Sales */}
        <Card title="Monthly Sales Summary">
          <Table
            columns={[
              {
                title: 'Month',
                dataIndex: 'period',
                key: 'period',
                render: (text) => <strong>{text}</strong>
              },
              {
                title: 'Total Sales',
                dataIndex: 'total_sales',
                key: 'total_sales',
                render: (text) => formatMoney(text)
              }
            ]}
            dataSource={monthlySales.map((m, idx) => ({ ...m, key: m.period || idx }))}
            rowKey="period"
            pagination={false}
            bordered
          />
        </Card>
      </div>
    </Spin>
  );
}

export default Reports;
