import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Col, Row, Spin, Statistic, Typography, message } from "antd";
import {
  BarChartOutlined,
  DollarOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import api from "../../api/axiosConfig";
import PageHeader from "../../components/layout/PageHeader";

function useCountUp(targetValue) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let animationFrame = 0;
    const startValue = 0;
    const duration = 750;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setValue(startValue + (targetValue - startValue) * easedProgress);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [targetValue]);

  return value;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function SvgSalesChart({ data }) {
  const normalized = data.length > 0 ? data : [];
  const chartWidth = 720;
  const chartHeight = 240;
  const chartPadding = 28;
  const maxValue = Math.max(...normalized.map((entry) => Number(entry.total_sales || 0)), 1);

  const points = normalized.map((entry, index) => {
    const x =
      chartPadding +
      (index * (chartWidth - chartPadding * 2)) / Math.max(normalized.length - 1, 1);
    const y =
      chartHeight -
      chartPadding -
      (Number(entry.total_sales || 0) / maxValue) * (chartHeight - chartPadding * 2);
    return { x, y, label: entry.period, value: entry.total_sales };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = points.length
    ? `${linePath} L ${points.at(-1).x} ${chartHeight - chartPadding} L ${points[0].x} ${
        chartHeight - chartPadding
      } Z`
    : "";

  return (
    <div style={{ overflow: "hidden" }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="240" role="img" aria-label="Monthly sales chart">
        <defs>
          <linearGradient id="papertechChartStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--papertech-primary)" />
            <stop offset="100%" stopColor="var(--papertech-success)" />
          </linearGradient>
          <linearGradient id="papertechChartFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(91, 82, 217, 0.4)" />
            <stop offset="100%" stopColor="rgba(91, 82, 217, 0)" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((lineIndex) => {
          const y = chartPadding + ((chartHeight - chartPadding * 2) / 3) * lineIndex;
          return <line key={lineIndex} x1={chartPadding} y1={y} x2={chartWidth - chartPadding} y2={y} stroke="var(--papertech-border)" strokeDasharray="4 6" />;
        })}

        {areaPath ? <path d={areaPath} fill="url(#papertechChartFill)" /> : null}
        {linePath ? <path d={linePath} fill="none" stroke="url(#papertechChartStroke)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5.5" fill="var(--papertech-surface-strong)" stroke="var(--papertech-primary)" strokeWidth="3" />
            <text x={point.x} y={chartHeight - 8} textAnchor="middle" fill="var(--papertech-text-muted)" fontSize="11">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function DashboardMetricCard({ icon, title, value, accent, description, onClick }) {
  return (
    <Card
      className="papertech-glass papertech-fade-in"
      onClick={onClick}
      hoverable
      style={{
        cursor: "pointer",
        height: "100%",
        borderRadius: 24,
        background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 12%, var(--papertech-surface-strong)) 0%, var(--papertech-surface) 100%)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {title}
          </Typography.Text>
          <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, letterSpacing: -0.8 }}>
            {value}
          </div>
          <Typography.Text style={{ color: "var(--papertech-text-muted)", display: "block", marginTop: 6 }}>
            {description}
          </Typography.Text>
        </div>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            display: "grid",
            placeItems: "center",
            color: accent,
            background: "color-mix(in srgb, currentColor 12%, transparent)",
            border: "1px solid var(--papertech-border)",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function AnimatedMetricValue({ value, isCurrency }) {
  const animatedValue = useCountUp(value);
  const formattedValue = isCurrency
    ? `Rs. ${formatCurrency(animatedValue)}`
    : Math.round(animatedValue).toLocaleString("en-US");

  return <>{formattedValue}</>;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [summaryResponse, salesResponse] = await Promise.all([
          api.get("/reports/dashboard"),
          api.get("/reports/monthly-sales"),
        ]);

        setSummary(summaryResponse.data.data || {});
        setMonthlySales((salesResponse.data.data || []).slice().reverse());
      } catch (error) {
        message.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const cards = useMemo(
    () => [
      {
        title: "Total Sales",
        value: Number(summary?.total_sales || 0),
        icon: <ShoppingOutlined />,
        accent: "#5b52d9",
        description: "Invoices generated across your company",
        onClick: () => navigate("/sales"),
      },
      {
        title: "Total Revenue",
        value: Number(summary?.total_revenue || 0),
        icon: <DollarOutlined />,
        accent: "#10b981",
        description: "Gross revenue recorded on invoices",
        onClick: () => navigate("/reports"),
      },
      {
        title: "Pending Invoices",
        value: Number(summary?.pending_invoices || 0),
        icon: <BarChartOutlined />,
        accent: "#f59e0b",
        description: "Open invoices that still need payment",
        onClick: () => navigate("/invoices"),
      },
      {
        title: "Paid Amount",
        value: Number(summary?.total_paid_amount || 0),
        icon: <WalletOutlined />,
        accent: "#06b6d4",
        description: "Payments already collected",
        onClick: () => navigate("/payments"),
      },
      {
        title: "Total Customers",
        value: Number(summary?.total_customers || 0),
        icon: <UserOutlined />,
        accent: "#8b7cff",
        description: "Active customers in the company",
        onClick: () => navigate("/customers"),
      },
      {
        title: "Total Vendors",
        value: Number(summary?.total_vendors || 0),
        icon: <TeamOutlined />,
        accent: "#ef4444",
        description: "Registered vendors and suppliers",
        onClick: () => navigate("/vendors"),
      },
    ],
    [navigate, summary],
  );

  const animatedRevenue = useCountUp(Number(summary?.total_revenue || 0));
  const animatedPaid = useCountUp(Number(summary?.total_paid_amount || 0));

  return (
    <Spin spinning={loading}>
      <div className="papertech-fade-in">
        <PageHeader
          title="Business Dashboard"
          description="Live insight into sales, payments, and customer health."
          actions={
            <Typography.Text className="papertech-muted">
              Revenue: Rs. {formatCurrency(animatedRevenue)} | Paid: Rs. {formatCurrency(animatedPaid)}
            </Typography.Text>
          }
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {cards.map((card) => (
            <Col key={card.title} xs={24} sm={12} xl={8}>
              <DashboardMetricCard
                icon={card.icon}
                title={card.title}
                value={<AnimatedMetricValue value={card.value} isCurrency={card.title.includes("Revenue") || card.title.includes("Paid")} />}
                accent={card.accent}
                description={card.description}
                onClick={card.onClick}
              />
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card
              className="papertech-glass"
              title={<Typography.Text strong>Monthly Sales Trend</Typography.Text>}
              style={{ height: "100%" }}
            >
              <SvgSalesChart data={monthlySales} />
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card
              className="papertech-glass"
              title={<Typography.Text strong>Monthly Snapshot</Typography.Text>}
              style={{ height: "100%" }}
            >
              <div style={{ display: "grid", gap: 14 }}>
                <Card bordered={false} className="papertech-surface-card">
                  <Statistic
                    title="Current Revenue"
                    value={Number(summary?.total_revenue || 0)}
                    prefix="Rs."
                    precision={0}
                  />
                </Card>
                <Card bordered={false} className="papertech-surface-card">
                  <Statistic
                    title="Pending Amount"
                    value={Number(summary?.pending_amount || 0)}
                    prefix="Rs."
                    precision={0}
                  />
                </Card>
                <Card bordered={false} className="papertech-surface-card">
                  <Statistic
                    title="Low Stock Alerts"
                    value={Number(summary?.low_stock_alerts || 0)}
                  />
                </Card>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
}

export default AdminDashboard;
