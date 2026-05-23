import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Typography,
  ConfigProvider,
  theme,
  App,
  Switch,
} from "antd";
import {
  LockOutlined,
  UserOutlined,
  MoonOutlined,
  SunOutlined,
  ThunderboltFilled,
  SafetyCertificateFilled,
  TeamOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  FileTextOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import api from "../../api/axiosConfig";
import { loginSuccess } from "../../store/authSlice";

const { Text } = Typography;

function Login() {
  const { message } = App.useApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const primaryBrandColor = "#7f6bff";

  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("papertech_darkMode");
    return savedMode === null ? true : savedMode === "true";
  });

  useEffect(() => {
    localStorage.setItem("papertech_darkMode", String(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 992);
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
      message.success("Login Successful");
      const role = response.data.data.role;
      const nextPath = role === "super_admin" ? "/companies" : role === "customer" ? "/sales" : role === "vendor" ? "/purchases" : "/dashboard";
      navigate(nextPath, {
        replace: true,
      });
    } catch (error) {
      console.log(error);
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
          padding: 0,
          background: darkMode
            ? "radial-gradient(circle at 20% 20%, #2a1b7f 0%, #060d30 50%, #04081f 100%)"
            : "radial-gradient(circle at 20% 20%, #d9dcff 0%, #f4f7ff 52%, #eef2ff 100%)",
          transition: "all 0.5s ease",
        }}
      >
        <div
          style={{
            width: "100vw",
            minHeight: "100vh",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.05fr 1fr",
            overflow: "hidden",
            background: darkMode
              ? "linear-gradient(135deg, #020617 0%, #0b112d 45%, #120c35 100%)"
              : "linear-gradient(135deg, #eef2ff 0%, #f8faff 45%, #ffffff 100%)",
          }}
        >
          <div
            style={{
              padding: isMobile ? "22px 18px" : "34px 38px",
              position: "relative",
              color: darkMode ? "#f8f9ff" : "#111827",
              background: darkMode
                ? "radial-gradient(circle at 40% 20%, rgba(116, 85, 255, 0.24), transparent 58%)"
                : "radial-gradient(circle at 40% 20%, rgba(109, 93, 255, 0.18), transparent 58%)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at center, rgba(117, 92, 255, 0.14), transparent 55%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                width: 520,
                height: 520,
                borderRadius: "50%",
                border: "2px solid rgba(143, 118, 255, 0.28)",
                top: "50%",
                left: "52%",
                transform: "translate(-50%, -50%) rotate(-12deg)",
                boxShadow: "0 0 80px rgba(116, 85, 255, 0.25)",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
                fontSize: isMobile ? 24 : 28,
                fontWeight: 800,
                letterSpacing: "-0.8px",
                color: primaryBrandColor,
                marginBottom: 48,
                marginTop: isMobile ? 12 : 10,
              }}
            >
              PAPER<span style={{ opacity: 0.8 }}>TECH</span>
            </div>

            <h1
              style={{
                position: "relative",
                zIndex: 2,
                fontSize: isMobile ? 30 : 48,
                lineHeight: "1.08",
                margin: 0,
                marginBottom: 30,
                maxWidth: isMobile ? "100%" : 470,
              }}
            >
              Smarter Workflow.
              <br />
              Better{" "}
              <span
                style={{
                  color: primaryBrandColor,
                  textShadow: "0 0 22px rgba(127, 107, 255, 0.45)",
                }}
              >
                Results.
              </span>
            </h1>

            <Text
              style={{
                position: "relative",
                zIndex: 2,
                fontSize: isMobile ? 15 : 18,
                maxWidth: 480,
                color: darkMode ? "#b8c1ea" : "#5b627f",
              }}
            >
              PaperTech helps your team manage documents, collaborate faster, and keep
              operations in one place.
            </Text>

            <div
              style={{
                position: "absolute",
                right: isMobile ? "-20%" : "4%",
                top: "18%",
                width: isMobile ? 260 : 520,
                height: isMobile ? 260 : 520,
                opacity: 0.9,
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 28,
                  background: "rgba(98, 87, 255, 0.1)",
                  border: "1px solid rgba(152, 130, 255, 0.18)",
                  transform: "rotate(-8deg)",
                  backdropFilter: "blur(8px)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top: 40,
                  left: 40,
                  right: 40,
                  height: 120,
                  borderRadius: 22,
                  background: "rgba(116, 85, 255, 0.12)",
                  border: "1px solid rgba(155, 133, 255, 0.22)",
                  transform: "rotate(6deg)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  bottom: 50,
                  left: 70,
                  width: 220,
                  height: 220,
                  borderRadius: 22,
                  background: "rgba(116, 85, 255, 0.14)",
                  border: "1px solid rgba(155, 133, 255, 0.22)",
                }}
              />
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 2,
                marginTop: isMobile ? 24 : 44,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {[
                {
                  icon: <ThunderboltFilled />,
                  title: "Fast & Efficient",
                  desc: "Automate repetitive tasks and save valuable time.",
                },
                {
                  icon: <SafetyCertificateFilled />,
                  title: "Secure & Reliable",
                  desc: "Enterprise-grade security to keep your data protected.",
                },
                {
                  icon: <TeamOutlined />,
                  title: "Team Collaboration",
                  desc: "Work together seamlessly and achieve more.",
                },
                {
                  icon: <DatabaseOutlined />,
                  title: "Smart Inventory",
                  desc: "Track stock, manage inventory, and monitor movements in real time.",
                },
                {
                  icon: <BarChartOutlined />,
                  title: "Advanced Analytics",
                  desc: "Get detailed reports and insights to make better business decisions.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      color: "#a08bff",
                      background: darkMode
                        ? "rgba(106, 87, 255, 0.16)"
                        : "rgba(106, 87, 255, 0.12)",
                      border: "1px solid rgba(120, 100, 255, 0.25)",
                    }}
                  >
                    {item.icon}
                  </div>

                  <div style={{ marginBottom: 40 }}>
                    <div
                      style={{
                        fontSize: isMobile ? 18 : 22,
                        fontWeight: 700,
                        marginBottom: 2,
                      }}
                    >
                      {item.title}
                    </div>

                    <Text
                      style={{
                        color: darkMode ? "#9fa8d6" : "#66708f",
                        fontSize: isMobile ? 14 : 16,
                      }}
                    >
                      {item.desc}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: isMobile ? "40px 18px" : "60px 38px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: darkMode
                ? "rgba(6, 15, 48, 0.82)"
                : "rgba(250, 252, 255, 0.9)",
              backdropFilter: "blur(18px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <Text
                  style={{
                    color: darkMode ? "#c4cbec" : "#4b5478",
                    margin: 0,
                    fontSize: 13,
                  }}
                >
                  {darkMode ? "Dark Mode" : "Light Mode"}
                </Text>

                <Switch
                  checked={darkMode}
                  onChange={setDarkMode}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                  style={{ background: darkMode ? "#5449d8" : "#9aa4ff" }}
                />
              </div>
            </div>

            <div
              style={{
                maxWidth: 460,
                width: "100%",
                margin: "0 auto",
              }}
            >
              <h2
                style={{
                  fontSize: isMobile ? 28 : 38,
                  marginBottom: 4,
                  color: darkMode ? "#f3f5ff" : "#141938",
                }}
              >
                Welcome Back
              </h2>

              <Text
                style={{
                  fontSize: isMobile ? 15 : 17,
                  color: darkMode ? "#9ca7d6" : "#6d7495",
                }}
              >
                Sign in to continue to your account
              </Text>

              <Form
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                style={{ marginTop: 24 }}
              >
                <Form.Item
                  label={
                    <span
                      style={{
                        color: darkMode ? "#e6ebff" : "#1c2242",
                        fontSize: 16,
                      }}
                    >
                      Username
                    </span>
                  }
                  name="username"
                  rules={[{ required: true, message: "Username is required" }]}
                >
                  <Input
                    prefix={
                      <UserOutlined
                        style={{ color: primaryBrandColor, marginRight: 8 }}
                      />
                    }
                    placeholder="Enter your username"
                    style={{
                      height: 48,
                      borderRadius: 10,
                      fontSize: 15,
                      background: darkMode
                        ? "rgba(11, 23, 71, 0.7)"
                        : "#ffffff",
                      border: darkMode
                        ? "1px solid rgba(98, 118, 214, 0.35)"
                        : "1px solid rgba(130, 141, 206, 0.4)",
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span
                      style={{
                        color: darkMode ? "#e6ebff" : "#1c2242",
                        fontSize: 16,
                      }}
                    >
                      Password
                    </span>
                  }
                  name="password"
                  rules={[{ required: true, message: "Password is required" }]}
                  style={{ marginBottom: 10 }}
                >
                  <Input.Password
                    prefix={
                      <LockOutlined
                        style={{ color: primaryBrandColor, marginRight: 8 }}
                      />
                    }
                    placeholder="Enter your password"
                    style={{
                      height: 48,
                      borderRadius: 10,
                      fontSize: 15,
                      background: darkMode
                        ? "rgba(11, 23, 71, 0.7)"
                        : "#ffffff",
                      border: darkMode
                        ? "1px solid rgba(98, 118, 214, 0.35)"
                        : "1px solid rgba(130, 141, 206, 0.4)",
                    }}
                  />
                </Form.Item>

                <div style={{ textAlign: "right", marginBottom: 22 }}>
                  <Button
                    type="link"
                    size="small"
                    style={{
                      color: primaryBrandColor,
                      fontSize: 15,
                      padding: 0,
                    }}
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
                    fontSize: 18,
                    background: "linear-gradient(135deg, #9777ff, #5f78ff)",
                    boxShadow: "0 14px 28px rgba(104, 105, 255, 0.34)",
                    border: "none",
                    marginTop: 6,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    Sign In <ArrowRightOutlined />
                  </span>
                </Button>
              </Form>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: darkMode ? "#6170ac" : "#9ba5c5",
                }}
              >
                © 2026 PaperTech Solutions. All rights reserved.
              </Text>
            </div>
          </div>
        </div>


      </div>
    </ConfigProvider>
  );
}

export default Login;
