import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Layout,
  Button,
  Space,
  ConfigProvider,
  theme,
  Typography,
  Spin,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../stores/authSlice";
import Sidebar from "./Sidebar";
import { useAppTheme } from "../../styles/theme/AppThemeContext";
import api from "../../services/apiClient";
import { firstAllowedPath, hasModuleAccess } from "../../lib/accessModules";
import { APP_NAME } from "../../constants/industryConfig";

const AdminDashboard = lazy(() => import("../../pages/dashboard/AdminDashboard"));
const CustomerList = lazy(() => import("../../pages/customers/CustomerList"));
const VendorList = lazy(() => import("../../pages/vendors/VendorList"));
const PurchaseList = lazy(() => import("../../pages/purchases/PurchaseList"));
const ProductList = lazy(() => import("../../pages/products/ProductList"));
const SalesHistory = lazy(() => import("../../pages/sales/SalesHistory"));
const InvoiceDetails = lazy(() => import("../../pages/invoices/InvoiceDetails"));
const PaymentList = lazy(() => import("../../pages/payments/PaymentList.jsx"));
const Reports = lazy(() => import("../../pages/reports/Reports"));
const LedgerView = lazy(() => import("../../pages/ledger/LedgerView"));
const CustomerSalesPage = lazy(() => import("../../pages/sales/CustomerSalesPage"));
const ChatSupport = lazy(() => import("../../pages/chat/ChatSupport"));
const CompaniesPage = lazy(() => import("../../pages/companies/CompaniesPage"));
const CompanyUsersPage = lazy(() => import("../../pages/users/CompanyUsersPage"));
const PoliciesPage = lazy(() => import("../../pages/admin/PoliciesPage"));

const { Header, Content, Sider, Footer } = Layout;

const adminRoutes = [
  { path: "/dashboard", module: "dashboard", element: <AdminDashboard /> },
  { path: "/users", module: "users", element: <CompanyUsersPage /> },
  { path: "/customers", module: "customers", element: <CustomerList /> },
  { path: "/vendors", module: "vendors", element: <VendorList /> },
  { path: "/purchases", module: "purchases", element: <PurchaseList /> },
  { path: "/products", module: "products", element: <ProductList /> },
  { path: "/sales", module: "sales", element: <SalesHistory /> },
  { path: "/invoices", module: "invoices", element: <SalesHistory /> },
  { path: "/invoices/:id", module: "invoices", element: <InvoiceDetails /> },
  { path: "/payments", module: "payments", element: <PaymentList /> },
  { path: "/reports", module: "reports", element: <Reports /> },
  { path: "/ledger", module: "customers", element: <LedgerView /> },
  { path: "/chat", module: "chat", element: <ChatSupport /> },
];

function DashboardLayout() {
  const [chatUnreadTotal, setChatUnreadTotal] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const previousUnreadRef = useRef(0);
  const previousIncomingIdRef = useRef(0);
  const chatNotificationInitializedRef = useRef(false);
  const [changePasswordForm] = Form.useForm();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useAppTheme();

  const themeToken = useMemo(
    () => ({
      colorPrimary: darkMode ? "#60a5fa" : "#2563eb",
      colorSuccess: darkMode ? "#6ee7b7" : "#059669",
      colorWarning: darkMode ? "#fbbf24" : "#f59e0b",
      colorError: darkMode ? "#f87171" : "#ef4444",
      colorText: darkMode ? "#e5eef9" : "#0f172a",
      colorTextSecondary: darkMode ? "#94a3b8" : "#64748b",
      colorBgBase: darkMode ? "#07111f" : "#eef2ff",
      colorBgContainer: darkMode ? "#0f172a" : "#ffffff",
      colorBorder: darkMode ? "rgba(148, 163, 184, 0.18)" : "rgba(15, 23, 42, 0.1)",
      borderRadius: 16,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    [darkMode],
  );

  useEffect(() => {
    if (!user?.role) {
      return undefined;
    }

    let mounted = true;

    const playNotificationSound = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gain.gain.value = 0.06;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.16);
      } catch (error) {
        return undefined;
      }
    };

    const pollContacts = async () => {
      try {
        const response = await api.get("/chat/unread-summary");
        if (!mounted) return;
        const totalUnread = Number(response.data?.data?.total_unread || 0);
        const latestIncomingId = Number(response.data?.data?.latest_incoming_message_id || 0);
        setChatUnreadTotal(totalUnread);

        if (
          chatNotificationInitializedRef.current &&
          (totalUnread > previousUnreadRef.current ||
            latestIncomingId > previousIncomingIdRef.current)
        ) {
          playNotificationSound();
        }

        previousUnreadRef.current = totalUnread;
        previousIncomingIdRef.current = latestIncomingId;
        chatNotificationInitializedRef.current = true;
      } catch (error) {
        return undefined;
      }
    };

    pollContacts();
    const intervalId = window.setInterval(pollContacts, 5000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [user?.role]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleChangePassword = async (values) => {
    try {
      setChangePasswordLoading(true);
      await api.post("/auth/change-password", values);
      message.success("Password updated successfully. Please login again.");
      setChangePasswordModalOpen(false);
      changePasswordForm.resetFields();
      handleLogout();
    } catch (error) {
      message.error(error.response?.data?.message || "Unable to change password");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const shellRoutes = (
    <Suspense
      fallback={
        <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
          <Spin size="large" />
        </div>
      }
    >
      <Routes>
        {user?.role === "super_admin" ? (
          <>
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/admin/policies" element={<PoliciesPage />} />
            <Route path="*" element={<Navigate to="/companies" replace />} />
          </>
        ) : user?.role === "admin" || user?.role === "company_user" ? (
          <>
            {user?.role === "admin" ? (
              <>
                <Route path="/admin/policies" element={<PoliciesPage />} />
              </>
            ) : null}
            {adminRoutes
              .filter((route) => hasModuleAccess(user, route.module))
              .map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            <Route path="*" element={<Navigate to={firstAllowedPath(user, adminRoutes)} replace />} />
          </>
        ) : user?.role === "vendor" ? (
          <>
            <Route path="/purchases" element={<PurchaseList />} />
            <Route path="/invoices" element={<SalesHistory />} />
            <Route path="/invoices/:id" element={<InvoiceDetails />} />
            <Route path="/chat" element={<ChatSupport />} />
            <Route path="*" element={<Navigate to="/purchases" replace />} />
          </>
        ) : (
          <>
            <Route path="/sales" element={<CustomerSalesPage />} />
            <Route path="/invoices" element={<SalesHistory />} />
            <Route path="/invoices/:id" element={<InvoiceDetails />} />
            <Route path="/chat" element={<ChatSupport />} />
            <Route path="*" element={<Navigate to="/invoices" replace />} />
          </>
        )}
      </Routes>
    </Suspense>
  );

  return (
    <ConfigProvider
      theme={{
        token: themeToken,
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout className="papertech-shell" style={{ minHeight: "100vh" }}>
        <Sider
          theme={darkMode ? "dark" : "light"}
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={274}
          collapsedWidth={86}
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            alignSelf: "flex-start",
            background: "var(--papertech-surface)",
            borderRight: "1px solid var(--papertech-border)",
            boxShadow: "var(--papertech-shadow-soft)",
            backdropFilter: "blur(18px)",
            transition: "all 220ms ease",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 12,
              padding: collapsed ? "0 14px" : "0 22px",
              borderBottom: "1px solid var(--papertech-border)",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                color: "#fff",
                background:
                  "linear-gradient(135deg, var(--papertech-primary) 0%, var(--papertech-success) 100%)",
                boxShadow: "0 16px 32px color-mix(in srgb, var(--papertech-primary) 32%, transparent)",
              }}
            >
              TS
            </div>
            {!collapsed ? (
              <div>
                <Typography.Text className="papertech-brand-title" strong style={{ display: "block", letterSpacing: 1.2 }}>
                  {APP_NAME.toUpperCase()}
                </Typography.Text>
              </div>
            ) : null}
          </div>
          <Sidebar
            darkMode={darkMode}
            collapsed={collapsed}
            onLogoutRequest={handleLogout}
            onChangePasswordRequest={() => setChangePasswordModalOpen(true)}
            chatUnreadTotal={chatUnreadTotal}
          />
        </Sider>

        <Layout>
          <Header
            style={{
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "0 24px",
              background: "var(--papertech-surface)",
              borderBottom: "1px solid var(--papertech-border)",
              boxShadow: "var(--papertech-shadow-soft)",
              backdropFilter: "blur(18px)",
            }}
          >
            <Space size={14}>
              <Button
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                type="text"
                onClick={() => setCollapsed((value) => !value)}
              />
              <Typography.Text strong style={{ fontSize: 16 }}>
                {user?.company_name ? `${user.company_name}` : APP_NAME}
              </Typography.Text>
            </Space>

            <Space size={10} wrap>
              <Button
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                type="text"
                onClick={toggleTheme}
              >
                {darkMode ? "Light" : "Dark"}
              </Button>
              <Button icon={<UserOutlined />} type="text">
                {user?.username}
              </Button>
            </Space>
          </Header>

          <Content style={{ padding: 24 }}>
            <div
              className="papertech-page__surface papertech-fade-in"
              style={{
                minHeight: "calc(100vh - 144px)",
                padding: 24,
              }}
            >
              {shellRoutes}
            </div>
          </Content>

          <Footer
            style={{
              textAlign: "center",
              color: "var(--papertech-text-muted)",
              padding: "12px 24px 24px",
            }}
          >
            (c) {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </Footer>
        </Layout>
      </Layout>

      <Modal
        title="Change Password"
        open={changePasswordModalOpen}
        centered
        destroyOnClose
        onCancel={() => {
          setChangePasswordModalOpen(false);
          changePasswordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={changePasswordForm}
          layout="vertical"
          requiredMark={false}
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="current_password"
            label="Current Password"
            rules={[{ required: true, message: "Current password is required" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Current password" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="New Password"
            rules={[
              { required: true, message: "New password is required" },
              { min: 6, message: "New password must be at least 6 characters" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="New password" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "Please confirm the new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
          </Form.Item>

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setChangePasswordModalOpen(false);
                changePasswordForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={changePasswordLoading}>
              Update Password
            </Button>
          </Space>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}

export default DashboardLayout;
