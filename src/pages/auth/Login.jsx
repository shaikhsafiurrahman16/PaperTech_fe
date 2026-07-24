import { useEffect, useState } from "react";
import { App, Button, Card, ConfigProvider, Form, Input, Space, Switch, Typography, theme } from "antd";
import {
  ArrowRightOutlined,
  BarChartOutlined,
  LockOutlined,
  MoonOutlined,
  SafetyCertificateFilled,
  SunOutlined,
  ThunderboltFilled,
  DatabaseOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { loginSuccess } from "../../store/authSlice";
import { useAppTheme } from "../../theme/AppThemeContext";
import { firstAllowedPath } from "../../utils/accessModules";
import { APP_NAME } from "../../utils/industryConfig";

const { Title, Text, Paragraph } = Typography;

const adminHomeRoutes = [
  { path: "/dashboard", module: "dashboard" },
  { path: "/users", module: "users" },
  { path: "/customers", module: "customers" },
  { path: "/vendors", module: "vendors" },
  { path: "/purchases", module: "purchases" },
  { path: "/products", module: "products" },
  { path: "/sales", module: "sales" },
  { path: "/invoices", module: "invoices" },
  { path: "/payments", module: "payments" },
  { path: "/reports", module: "reports" },
  { path: "/chat", module: "chat" },
];

function Login() {
  const { message } = App.useApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1100);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1100);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await api.post("/auth/login", values);
      dispatch(
        loginSuccess({
          token: response.data.data.token,
          user: response.data.data,
        }),
      );
      message.success("Welcome back");
      const role = response.data.data.role;
      const nextPath =
        role === "super_admin"
          ? "/companies"
          : role === "customer"
            ? "/sales"
            : role === "vendor"
              ? "/purchases"
              : firstAllowedPath(response.data.data, adminHomeRoutes);
      navigate(nextPath, { replace: true });
    } catch (error) {
      message.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const themeConfig = {
    token: {
      colorPrimary: "#5b52d9",
      colorBgBase: darkMode ? "#07111f" : "#eef2ff",
      colorTextBase: darkMode ? "#e5eef9" : "#0f172a",
      borderRadius: 16,
      controlHeight: 46,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  const featureCards = [
    {
      icon: <ThunderboltFilled />,
      title: "Fast Operations",
      text: "Built for quick workflows and low-friction daily use.",
    },
    {
      icon: <BarChartOutlined />,
      title: "Live Insights",
      text: "Dashboards and reports designed for decision making.",
    },
    {
      icon: <WalletOutlined />,
      title: "Clean Finance",
      text: "Invoices, payments, and ledgers in one place.",
    },
    {
      icon: <DatabaseOutlined />, 
      title: "Smart Inventory",
      text: "Real-time stock tracking and automated reorder alerts.",
    },
    {
      icon: <LockOutlined />, 
      title: "Secure Data",
      text: "Enterprise-grade security and automated daily backups.",
    },
    {
      icon: <TeamOutlined />,
      title: "Easy Collaboration",
      text: "Multi-user access with customizable roles and permissions.",
    },
  ];

  return (
    <ConfigProvider theme={themeConfig}>
      <div
        className="papertech-fade-in"
        style={{
          minHeight: "100vh",
          padding: isMobile ? 16 : 28,
          background:
            darkMode
              ? "radial-gradient(circle at top left, rgba(91, 82, 217, 0.28), transparent 26%), radial-gradient(circle at 85% 10%, rgba(34, 197, 94, 0.16), transparent 24%), linear-gradient(135deg, #050b16 0%, #07111f 48%, #0b1528 100%)"
              : "radial-gradient(circle at top left, rgba(91, 82, 217, 0.16), transparent 26%), radial-gradient(circle at 85% 10%, rgba(34, 197, 94, 0.12), transparent 24%), linear-gradient(135deg, #f7f8ff 0%, #eef2ff 48%, #ffffff 100%)",
          display: "grid",
          alignItems: "stretch",
        }}
      >
        <div
          className="papertech-glass-strong"
          style={{
            minHeight: "calc(100vh - 56px)",
            borderRadius: 32,
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
          }}
        >
          <div
            style={{
              padding: isMobile ? 28 : 42,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background:
                darkMode
                  ? "linear-gradient(180deg, rgba(12, 20, 41, 0.92), rgba(7, 17, 31, 0.92))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,248,255,0.92))",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 18% 22%, rgba(91, 82, 217, 0.18), transparent 28%), radial-gradient(circle at 85% 68%, rgba(16, 185, 129, 0.12), transparent 24%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <Space direction="vertical" size={18} style={{ width: "100%" }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontWeight: 900,
                    letterSpacing: 1,
                    background: "linear-gradient(135deg, #5b52d9 0%, #10b981 100%)",
                    boxShadow: "0 18px 40px rgba(91, 82, 217, 0.28)",
                  }}
                >
                  TS
                </div>
                <div>
                  <Title level={1} style={{ margin: 0, lineHeight: 1.02, letterSpacing: -1.2 }}>
                    {APP_NAME}
                  </Title>
                  <Paragraph
                    style={{
                      marginTop: 12,
                      marginBottom: 0,
                      maxWidth: 560,
                      fontSize: 16,
                      color: "var(--papertech-text-muted)",
                    }}
                  >
                    Manage sales, invoices, payments, vendors, and customers from a
                    polished desktop experience.
                  </Paragraph>
                </div>
              </Space>

              <div
                style={{
                  marginTop: isMobile ? 28 : 44,
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 14,
                }}
              >
                {featureCards.map((item) => (
                  <Card
                    key={item.title}
                    bordered={false}
                    className="papertech-glass"
                    style={{
                      borderRadius: 22,
                      minHeight: 132,
                      background:
                        "linear-gradient(180deg, color-mix(in srgb, var(--papertech-primary) 8%, var(--papertech-surface-strong)) 0%, var(--papertech-surface) 100%)",
                    }}
                  >
                    <div style={{ color: "#5b52d9", fontSize: 20, marginBottom: 12 }}>
                      {item.icon}
                    </div>
                    <Title level={5} style={{ margin: 0 }}>
                      {item.title}
                    </Title>
                    <Text type="secondary">{item.text}</Text>
                  </Card>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div>
                <Text type="secondary">Mode</Text>
                <div style={{ marginTop: 8 }}>
                  <Switch
                    checked={darkMode}
                    onChange={setDarkMode}
                    checkedChildren={<MoonOutlined />}
                    unCheckedChildren={<SunOutlined />}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: isMobile ? 24 : 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                darkMode
                  ? "linear-gradient(180deg, rgba(7, 17, 31, 0.92), rgba(11, 21, 40, 0.92))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,255,0.92))",
            }}
          >
            <div style={{ width: "100%", maxWidth: 440 }}>
              <Card
                bordered={false}
                className="papertech-glass-strong"
                style={{
                  borderRadius: 28,
                  padding: 4,
                }}
              >
                <div style={{ padding: isMobile ? 22 : 30 }}>
                  <Title level={2} style={{ marginTop: 0, marginBottom: 8 }}>
                    Welcome back
                  </Title>
                  <Text type="secondary">
                    Sign in to continue to your secure workspace.
                  </Text>

                  <Form
                    layout="vertical"
                    requiredMark={false}
                    onFinish={onFinish}
                    style={{ marginTop: 28 }}
                  >
                    <Form.Item
                      label="Username"
                      name="username"
                      rules={[{ required: true, message: "Username is required" }]}
                    >
                      <Input
                        size="large"
                        prefix={<UserOutlined style={{ color: "#5b52d9" }} />}
                        placeholder="Enter your username"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Password"
                      name="password"
                      rules={[{ required: true, message: "Password is required" }]}
                    >
                      <Input.Password
                        size="large"
                        prefix={<LockOutlined style={{ color: "#5b52d9" }} />}
                        placeholder="Enter your password"
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 14 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        size="large"
                        style={{ height: 48 }}
                      >
                        Sign In <ArrowRightOutlined />
                      </Button>
                    </Form.Item>
                  </Form>

                  {/* <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      color: "var(--papertech-text-muted)",
                      fontSize: 12,
                    }}
                  >
                  </div> */}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default Login;
