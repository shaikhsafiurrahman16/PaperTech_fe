import { Badge, Button, Menu } from "antd";
import {
  ApartmentOutlined,
  BarChartOutlined,
  ControlOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  LockOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasModuleAccess } from "../../lib/accessModules";

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
  const defaultOpenKeys = currentPath.startsWith("/admin") || currentPath.startsWith("/companies")
    ? ["admin-console"]
    : currentPath === "/users"
      ? ["admin-console"]
      : [];

  const menuByRole = {
    super_admin: [
      {
        key: "admin-console",
        icon: <ControlOutlined />,
        label: "Admin Console",
        children: [
          { key: "/companies", icon: <ApartmentOutlined />, label: "Companies" },
          { key: "/admin/policies", icon: <SafetyCertificateOutlined />, label: "Policies" },
        ],
      },
    ],
    admin: [
      { key: "/dashboard", module: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
      {
        key: "admin-console",
        icon: <ControlOutlined />,
        label: "Admin Console",
        children: [
          { key: "/users", module: "users", icon: <UsergroupAddOutlined />, label: "Users" },
          { key: "/admin/policies", icon: <SafetyCertificateOutlined />, label: "Policies" },
        ],
      },
      { key: "/customers", module: "customers", icon: <UserOutlined />, label: "Customers" },
      { key: "/vendors", module: "vendors", icon: <TeamOutlined />, label: "Vendors" },
      { key: "/purchases", module: "purchases", icon: <ShoppingCartOutlined />, label: "Purchases" },
      { key: "/products", module: "products", icon: <ShoppingOutlined />, label: "Products" },
      { key: "/sales", module: "sales", icon: <FileTextOutlined />, label: "Sales" },
      { key: "/invoices", module: "invoices", icon: <FileTextOutlined />, label: "Invoices" },
      { key: "/payments", module: "payments", icon: <DollarOutlined />, label: "Payments" },
      { key: "/reports", module: "reports", icon: <BarChartOutlined />, label: "Reports" },
      {
        key: "/chat",
        module: "chat",
        icon: <MessageOutlined />,
        label: (
          <Badge dot={chatUnreadTotal > 0} offset={[6, 0]}>
            <span>Chat Support</span>
          </Badge>
        ),
      },
    ],
    company_user: [
      { key: "/dashboard", module: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
      { key: "/customers", module: "customers", icon: <UserOutlined />, label: "Customers" },
      { key: "/vendors", module: "vendors", icon: <TeamOutlined />, label: "Vendors" },
      { key: "/purchases", module: "purchases", icon: <ShoppingCartOutlined />, label: "Purchases" },
      { key: "/products", module: "products", icon: <ShoppingOutlined />, label: "Products" },
      { key: "/sales", module: "sales", icon: <FileTextOutlined />, label: "Sales" },
      { key: "/invoices", module: "invoices", icon: <FileTextOutlined />, label: "Invoices" },
      { key: "/payments", module: "payments", icon: <DollarOutlined />, label: "Payments" },
      { key: "/reports", module: "reports", icon: <BarChartOutlined />, label: "Reports" },
      {
        key: "/chat",
        module: "chat",
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

  const menuItems = (menuByRole[user?.role] || menuByRole.customer)
    .map((item) => {
      if (item.children) {
        const children = item.children.filter((child) => hasModuleAccess(user, child.module));
        if (!children.length) {
          return null;
        }
        return { ...item, children };
      }
      return hasModuleAccess(user, item.module) ? item : null;
    })
    .filter(Boolean);

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
        defaultOpenKeys={defaultOpenKeys}
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
