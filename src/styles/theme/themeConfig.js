export const PAPERTECH_THEME = {
  onyx: "#0D0A0B",
  charcoalBlue: "#454955",
  lavenderMist: "#F3EFF5",
  textStrong: "#0D0A0B",
  textMuted: "#454955",
  border: "rgba(69, 73, 85, 0.14)",
  borderStrong: "rgba(69, 73, 85, 0.22)",
};

export const lightTheme = {
  token: {
    colorPrimary: PAPERTECH_THEME.charcoalBlue,
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: PAPERTECH_THEME.charcoalBlue,
    colorTextBase: PAPERTECH_THEME.textStrong,
    colorBgBase: PAPERTECH_THEME.lavenderMist,
    colorBorder: PAPERTECH_THEME.border,
    colorBgContainer: "#ffffff",
    borderRadius: 12,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto"',
  },
};

export const darkTheme = {
  token: {
    colorPrimary: PAPERTECH_THEME.lavenderMist,
    colorSuccess: "#6ee7b7",
    colorWarning: "#fbbf24",
    colorError: "#f87171",
    colorInfo: PAPERTECH_THEME.lavenderMist,
    colorTextBase: PAPERTECH_THEME.lavenderMist,
    colorBgBase: PAPERTECH_THEME.onyx,
    colorBorder: PAPERTECH_THEME.borderStrong,
    colorBgContainer: PAPERTECH_THEME.charcoalBlue,
    borderRadius: 12,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto"',
  },
  algorithm: 'dark',
};
