import { Layout, theme, Button, Dropdown, Space, ConfigProvider, Modal } from "antd";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  BgColorsOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import Sidebar from "./Sidebar";
import AdminDashboard from "../../pages/dashboard/AdminDashboard";
import CustomerList from "../../pages/customers/CustomerList";
import VendorList from "../../pages/vendors/VendorList";
import PurchaseList from "../../pages/purchases/PurchaseList";
import ProductList from "../../pages/products/ProductList";
import SalesHistory from "../../pages/sales/SalesHistory";
import InvoiceDetails from "../../pages/invoices/InvoiceDetails";
import PaymentList from "../../pages/payments/PaymentList";
import Reports from "../../pages/reports/Reports";
import LedgerView from "../../pages/ledger/LedgerView";
import CustomerSalesPage from "../../pages/sales/CustomerSalesPage";
import ChatSupport from "../../pages/chat/ChatSupport";
import CompaniesPage from "../../pages/companies/CompaniesPage";
import api from "../../api/axiosConfig";

const { Header, Content, Sider, Footer } = Layout;

function DashboardLayout() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("papertech_darkMode") === "true",
  );
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [chatUnreadTotal, setChatUnreadTotal] = useState(0);
  const previousUnreadRef = useRef(0);
  const previousIncomingIdRef = useRef(0);
  const chatNotificationInitializedRef = useRef(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    token: { colorBgContainer, colorText, colorPrimaryBorder, colorBorder },
  } = theme.useToken();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, [darkMode]);

  const handleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("papertech_darkMode", newMode);
  };

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.18);
    } catch (error) {
    }
  };

  useEffect(() => {
    if (!user?.role) return undefined;

    let mounted = true;
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
      }
    };

    pollContacts();
    const intervalId = setInterval(pollContacts, 5000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [user?.role]);

  const confirmLogout = () => {
    dispatch(logout());
    setLogoutModalOpen(false);
    navigate("/login");
  };

  const userMenuItems = [
    { key: "profile", label: "Profile" },
    { key: "logout", label: "Logout" },
  ];

  const themeToken = darkMode
    ? {
        colorPrimary: "#5b52d9",
        colorSuccess: "#6ee7b7",
        colorWarning: "#fbbf24",
        colorError: "#f87171",
        colorText: "#f1f5f9",
        colorTextSecondary: "#cbd5e1",
        colorBgBase: "#0f172a",
        colorBorder: "#334155",
        colorBgContainer: "#1e293b",
        borderRadius: 12,
      }
    : {
        colorPrimary: "#5b52d9",
        colorSuccess: "#10b981",
        colorWarning: "#f59e0b",
        colorError: "#ef4444",
        colorText: "#1e293b",
        colorTextSecondary: "#64748b",
        colorBgBase: "#ffffff",
        colorBorder: "#e2e8f0",
        colorBgContainer: "#ffffff",
        borderRadius: 12,
      };

  return (
    <ConfigProvider
      theme={{
        token: themeToken,
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          theme={darkMode ? "dark" : "light"}
          collapsible
          trigger={null}
          style={{
            background: darkMode ? "#1e293b" : "#ffffff",
            borderRight: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
          }}
        >
          <div
            style={{
              height: 64,
              background: darkMode ? "#0f172a" : "#5b52d9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#fff",
              fontSize: 18,
              padding: "0 16px",
              boxShadow: darkMode
                ? "0 2px 8px rgba(0,0,0,0.45)"
                : "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ letterSpacing: "1px" }}>PAPERTECH</div>
          </div>
          <Sidebar
            darkMode={darkMode}
            onLogoutRequest={() => setLogoutModalOpen(true)}
            chatUnreadTotal={chatUnreadTotal}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: "0 24px",
              background: darkMode ? "#1e293b" : "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: darkMode
                ? "0 2px 8px rgba(0,0,0,0.45)"
                : "0 2px 8px rgba(0,0,0,0.1)",
              borderBottom: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: darkMode ? "#e0e7ff" : "#1e293b",
              }}
            >
              Welcome, {user?.full_name || user?.username}{user?.company_name ? ` - ${user.company_name}` : ""}
            </div>
            <Space size="large">
              <Button
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={handleDarkMode}
                title={darkMode ? "Light Mode" : "Dark Mode"}
                type="text"
                style={{ color: darkMode ? "#cbd5e1" : "#64748b" }}
              >
                {darkMode ? "Light" : "Dark"}
              </Button>
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: ({ key }) => {
                    if (key === "logout") {
                      setLogoutModalOpen(true);
                    }
                  },
                }}
              >
                <Button
                  icon={<UserOutlined />}
                  type="text"
                  style={{ color: darkMode ? "#cbd5e1" : "#64748b" }}
                >
                  {user?.username}
                </Button>
              </Dropdown>
            </Space>
          </Header>
          <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
            <div
              style={{
                padding: 24,
                minHeight: "calc(100vh - 180px)",
                background: darkMode ? "#0f172a" : "#f8fafc",
                borderRadius: 12,
              }}
            >
              <Routes>
                {user?.role === "super_admin" ? (
                  <>
                    <Route path="/companies" element={<CompaniesPage />} />
                    <Route
                      path="*"
                      element={<Navigate to="/companies" replace />}
                    />
                  </>
                ) : user?.role === "admin" ? (
                  <>
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/customers" element={<CustomerList />} />
                    <Route path="/vendors" element={<VendorList />} />
                    <Route path="/purchases" element={<PurchaseList />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/sales" element={<SalesHistory />} />
                    <Route path="/invoices" element={<SalesHistory />} />
                    <Route path="/invoices/:id" element={<InvoiceDetails />} />
                    <Route path="/payments" element={<PaymentList />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/ledger" element={<LedgerView />} />
                    <Route path="/chat" element={<ChatSupport />} />
                    <Route
                      path="*"
                      element={<Navigate to="/dashboard" replace />}
                    />
                  </>
                ) : user?.role === "vendor" ? (
                  <>
                    <Route path="/purchases" element={<PurchaseList />} />
                    <Route path="/invoices" element={<SalesHistory />} />
                    <Route path="/invoices/:id" element={<InvoiceDetails />} />
                    <Route path="/chat" element={<ChatSupport />} />
                    <Route
                      path="*"
                      element={<Navigate to="/purchases" replace />}
                    />
                  </>
                ) : (
                  <>
                    <Route path="/sales" element={<CustomerSalesPage />} />
                    <Route path="/invoices" element={<SalesHistory />} />
                    <Route path="/invoices/:id" element={<InvoiceDetails />} />
                    <Route path="/chat" element={<ChatSupport />} />
                    <Route
                      path="*"
                      element={<Navigate to="/invoices" replace />}
                    />
                  </>
                )}
              </Routes>
            </div>
          </Content>
          <Footer
            style={{
              textAlign: "center",
              color: darkMode ? "#cbd5e1" : "#64748b",
              background: darkMode ? "#0f172a" : "#f8fafc",
            }}
          >
            © {new Date().getFullYear()} PAPERTECH. All rights reserved.
          </Footer>
        </Layout>
      </Layout>
      <Modal
        title="Confirm Logout"
        open={logoutModalOpen}
        centered
        okText="Logout"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        onOk={confirmLogout}
        onCancel={() => setLogoutModalOpen(false)}
      >
        Are you sure you want to logout?
      </Modal>
    </ConfigProvider>
  );
}

export default DashboardLayout;
