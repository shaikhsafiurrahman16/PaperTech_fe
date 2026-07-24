export const ACCESS_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Users" },
  { key: "customers", label: "Customers" },
  { key: "vendors", label: "Vendors" },
  { key: "purchases", label: "Purchases" },
  { key: "products", label: "Products" },
  { key: "sales", label: "Sales" },
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
  { key: "reports", label: "Reports" },
  { key: "chat", label: "Chat Support" },
];

export const ACCESS_ACTIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Add" },
  { key: "update", label: "Edit" },
  { key: "delete", label: "Delete" },
];

export const MODULE_ACTIONS = {
  dashboard: ["view"],
  users: ["view", "create", "update", "delete"],
  customers: ["view", "create", "update", "delete"],
  vendors: ["view", "create", "update", "delete"],
  purchases: ["view", "create", "update", "delete"],
  products: ["view", "create", "update", "delete"],
  sales: ["view", "create", "update", "delete"],
  invoices: ["view", "create", "update", "delete"],
  payments: ["view", "create", "update", "delete"],
  reports: ["view"],
  chat: ["view"],
};

export function getActionsForModule(moduleKey) {
  return MODULE_ACTIONS[moduleKey] || ACCESS_ACTIONS.map((action) => action.key);
}

export function getModulesForPolicyCreator(role) {
  if (role === "super_admin") {
    return ACCESS_MODULES;
  }
  return ACCESS_MODULES.filter((moduleItem) => moduleItem.key !== "users");
}

export function normalizeModules(modules) {
  if (modules == null || modules === "") {
    return null;
  }

  if (Array.isArray(modules)) {
    return modules;
  }

  try {
    const parsed = JSON.parse(modules);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function hasModuleAccess(user, moduleKey, actionKey = "view") {
  if (!moduleKey || user?.role === "super_admin") {
    return true;
  }

  const modules = normalizeModules(user?.allowed_modules);
  if (modules === null) {
    return true;
  }

  return modules.includes(moduleKey) || modules.includes(`${moduleKey}.${actionKey}`);
}

export function hasAnyModuleAction(user, moduleKey) {
  if (!moduleKey || user?.role === "super_admin") {
    return true;
  }

  const modules = normalizeModules(user?.allowed_modules);
  if (modules === null) {
    return true;
  }

  return (
    modules.includes(moduleKey) ||
    getActionsForModule(moduleKey).some((actionKey) => modules.includes(`${moduleKey}.${actionKey}`))
  );
}

export function firstAllowedPath(user, routes) {
  return routes.find((route) => hasModuleAccess(user, route.module, route.action || "view"))?.path || "/login";
}
