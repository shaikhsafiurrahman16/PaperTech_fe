import { Badge, Button, Menu } from "antd";
import {
  ApartmentOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  LockOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function Sidebar({
  darkMode,
  collapsed,
  onLogoutRequest,
  onChangePasswordRequest,
  chatUnreadTotal = 0,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const currentPath = window.papertechDesktop
    ? location.hash.replace(/^#/, "") || "/dashboard"
    : location.pathname;
  const selectedPath = currentPath.startsWith("/invoices/") ? "/invoices" : currentPath;

  const menuByRole = {
    super_admin: [{ key: "/companies", icon: <ApartmentOutlined />, label: "Companies" }],
    admin: [
      { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
      { key: "/customers", icon: <UserOutlined />, label: "Customers" },
      { key: "/vendors", icon: <TeamOutlined />, label: "Vendors" },
      { key: "/purchases", icon: <ShoppingCartOutlined />, label: "Purchases" },
      { key: "/products", icon: <ShoppingOutlined />, label: "Products" },
      { key: "/sales", icon: <FileTextOutlined />, label: "Sales" },
      { key: "/invoices", icon: <FileTextOutlined />, label: "Invoices" },
      { key: "/payments", icon: <DollarOutlined />, label: "Payments" },
      { key: "/reports", icon: <BarChartOutlined />, label: "Reports" },
      {
        key: "/chat",
        icon: <MessageOutlined />,
        label: (
          <Badge dot={chatUnreadTotal > 0} offset={[6, 0]}>
            <span>Chat Support</span>
          </Badge>
        ),
      },
    ],
    vendor: [
      { key: "/purchases", icon: <ShoppingCartOutlined />, label: "My Purchases" },
      { key: "/invoices", icon: <FileTextOutlined />, label: "My Invoices" },
      {
        key: "/chat",
        icon: <MessageOutlined />,
        label: (
          <Badge dot={chatUnreadTotal > 0} offset={[6, 0]}>
            <span>Chat Support</span>
          </Badge>
        ),
      },
    ],
    customer: [
      { key: "/sales", icon: <FileTextOutlined />, label: "My Purchases" },
      { key: "/invoices", icon: <FileTextOutlined />, label: "My Invoices" },
      {
        key: "/chat",
        icon: <MessageOutlined />,
        label: (
          <Badge dot={chatUnreadTotal > 0} offset={[6, 0]}>
            <span>Chat Support</span>
          </Badge>
        ),
      },
    ],
  };

  const menuItems = menuByRole[user?.role] || menuByRole.customer;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 72px)",
      }}
    >
      <Menu
        theme={darkMode ? "dark" : "light"}
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[selectedPath]}
        onClick={({ key }) => navigate(key)}
        style={{
          flex: 1,
          minHeight: 0,
          background: "transparent",
          borderRight: "none",
          padding: collapsed ? "12px 8px" : "12px 10px",
          overflowY: "auto",
        }}
        items={menuItems}
      />

      <div
        style={{
          padding: collapsed ? 12 : 16,
          borderTop: "1px solid var(--papertech-border)",
          display: "grid",
          gap: 10,
          background: "color-mix(in srgb, var(--papertech-surface) 92%, transparent)",
        }}
      >
        <Button
          block
          type="text"
          icon={<LockOutlined />}
          onClick={() => onChangePasswordRequest?.()}
          style={{
            justifyContent: collapsed ? "center" : "flex-start",
            color: "var(--papertech-text)",
          }}
        >
          {collapsed ? null : "Change Password"}
        </Button>
        <Button
          block
          danger
          type="text"
          icon={<LogoutOutlined />}
          onClick={() => onLogoutRequest?.()}
          style={{
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          {collapsed ? null : "Logout"}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
