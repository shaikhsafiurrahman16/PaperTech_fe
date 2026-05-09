import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  ConfigProvider,
  theme,
  App,
} from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import api from "../../api/axiosConfig";
import { loginSuccess } from "../../store/authSlice";

const { Text } = Typography;

function Login() {
  const { message } = App.useApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const primaryBrandColor = "#818cf8";

  const [darkMode] = useState(
    localStorage.getItem("papertech_darkMode") === "true",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

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
      message.success("Login Successful");
      navigate("/dashboard");
    } catch (error) {
      console.log(error)
      message.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const themeConfig = {
    token: {
      colorPrimary: primaryBrandColor,
      colorBgBase: darkMode ? "#0f172a" : "#ffffff",
      colorTextBase: darkMode ? "#f1f5f9" : "#1e293b",
      borderRadius: 12,
      controlHeight: 45,
    },
    algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: darkMode
            ? "radial-gradient(circle at top right, #1e1b4b, #0f172a)"
            : "radial-gradient(circle at top right, #eef2ff, #f8fafc)",
          transition: "all 0.5s ease",
        }}
      >
        <Card
          bordered={false}
          style={{
            width: "100%",
            maxWidth: 400,
            borderRadius: 24,
            backdropFilter: "blur(20px)",
            background: darkMode
              ? "rgba(30, 41, 59, 0.4)"
              : "rgba(255, 255, 255, 0.7)",
            boxShadow: darkMode
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
            border: darkMode
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: primaryBrandColor,
                marginBottom: 8,
              }}
            >
              PAPER<span style={{ opacity: 0.7 }}>TECH</span>
            </div>
            <Text
              style={{
                fontSize: 15,
                color: darkMode ? "#94a3b8" : "#64748b",
                fontWeight: 400,
              }}
            >
              Enter your credentials to access your account
            </Text>
          </div>

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input
                prefix={
                  <UserOutlined
                    style={{ color: primaryBrandColor, marginRight: 8 }}
                  />
                }
                placeholder="Username"
                style={{
                  background: darkMode ? "rgba(15, 23, 42, 0.6)" : "#fff",
                  border: "1px solid rgba(129, 140, 248, 0.2)",
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Password is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Input.Password
                prefix={
                  <LockOutlined
                    style={{ color: primaryBrandColor, marginRight: 8 }}
                  />
                }
                placeholder="Password"
                style={{
                  background: darkMode ? "rgba(15, 23, 42, 0.6)" : "#fff",
                  border: "1px solid rgba(129, 140, 248, 0.2)",
                }}
              />
            </Form.Item>

            <div style={{ textAlign: "right", marginBottom: 24 }}>
              <Button
                type="link"
                size="small"
                style={{ color: primaryBrandColor, padding: 0 }}
              >
                Forgot Password?
              </Button>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 50,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 16,
                background: `linear-gradient(135deg, ${primaryBrandColor}, #6366f1)`,
                boxShadow: `0 10px 15px -3px rgba(99, 102, 241, 0.3)`,
                border: "none",
                marginTop: 10,
              }}
            >
              Sign In
            </Button>
          </Form>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Text
              style={{ fontSize: 13, color: darkMode ? "#475569" : "#cbd5e1" }}
            >
              © 2026 PaperTech Solutions. All rights reserved.
            </Text>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}

export default Login;
