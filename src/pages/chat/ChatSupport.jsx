import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Empty, Input, List, Space, Tag, Typography, message as antMessage, theme } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import api from "../../services/apiClient";
import PageHeader from "../../components/layout/PageHeader";

const { Text, Title } = Typography;

function formatTime(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toLocaleString();
}

function ChatSupport() {
  const { user } = useSelector((state) => state.auth);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const activeContactRef = useRef(null);
  const contactsLoadedOnceRef = useRef(false);
  const {
    token: { colorText, colorTextSecondary, colorPrimaryBg, colorBgContainer, colorBorderSecondary },
  } = theme.useToken();

  const activeKey = useMemo(() => {
    if (!activeContact) return null;
    return `${activeContact.role}:${activeContact.id}`;
  }, [activeContact]);

  const loadContacts = async () => {
    try {
      const response = await api.get("/chat/contacts");
      const list = response.data?.data || [];
      setContacts(list);
      if (!activeContactRef.current && list.length) {
        setActiveContact(list[0]);
      }
      contactsLoadedOnceRef.current = true;
    } catch (error) {
      antMessage.error(error.response?.data?.message || "Failed to load chat contacts");
    }
  };

  const loadMessages = async (contact, silent = false) => {
    if (!contact) return;
    if (!silent) setLoading(true);
    try {
      const response = await api.get(`/chat/${contact.role}/${contact.id}/messages`);
      setChatMessages(response.data?.data || []);
      if (!silent || !contactsLoadedOnceRef.current) {
        await loadContacts();
      }
    } catch (error) {
      antMessage.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    const contactsInterval = setInterval(() => {
      loadContacts();
    }, 5000);
    return () => clearInterval(contactsInterval);
  }, []);

  useEffect(() => {
    if (!activeContact) return;
    activeContactRef.current = activeContact;
    loadMessages(activeContact);
    const intervalId = setInterval(() => {
      loadMessages(activeContact, true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [activeContact]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeContact) return;

    setSending(true);
    try {
      await api.post(`/chat/${activeContact.role}/${activeContact.id}/messages`, { message: text });
      setDraft("");
      await loadMessages(activeContact, true);
    } catch (error) {
      antMessage.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card bordered={false} style={{ borderRadius: 20 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <PageHeader
          title="Chat Support"
          description={user?.role === "admin" ? "Chat with vendors and customers" : "Chat with admin support"}
        />

        <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", gap: 16 }}>
          <Card size="small" title="Contacts" style={{ borderRadius: 16 }}>
            <List
              dataSource={contacts}
              locale={{ emptyText: <Empty description="No contacts available" /> }}
              renderItem={(item) => {
                const isActive = activeKey === `${item.role}:${item.id}`;
                return (
                  <List.Item
                    onClick={() => setActiveContact(item)}
                    style={{
                      cursor: "pointer",
                      borderRadius: 8,
                      background: isActive ? colorPrimaryBg : "transparent",
                      border: isActive ? `1px solid ${colorBorderSecondary}` : "1px solid transparent",
                      padding: 10,
                    }}
                  >
                    <Space direction="vertical" size={0}>
                      <Space>
                        <Badge dot={Number(item.unread_count || 0) > 0}>
                          <Text strong style={{ color: colorText }}>{item.name}</Text>
                        </Badge>
                        <Tag color={item.role === "admin" ? "blue" : item.role === "vendor" ? "purple" : "green"}>
                          {item.role}
                        </Tag>
                      </Space>
                      {item.subtitle ? <Text style={{ color: colorTextSecondary }}>{item.subtitle}</Text> : null}
                    </Space>
                  </List.Item>
                );
              }}
            />
          </Card>

          <Card
            size="small"
            title={
              activeContact ? (
                <Space>
                  <Text strong style={{ color: colorText }}>{`Conversation with ${activeContact.name}`}</Text>
                  <Tag color={activeContact.role === "admin" ? "blue" : activeContact.role === "vendor" ? "purple" : "green"}>
                    {activeContact.role}
                  </Tag>
                </Space>
              ) : (
                "Select a contact"
              )
            }
            loading={loading}
            style={{ borderRadius: 16 }}
          >
            {!activeContact ? (
              <Empty description="Select a contact to start chat" />
            ) : (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div style={{ maxHeight: 460, overflowY: "auto", padding: "4px 0" }}>
                  <Space direction="vertical" size={10} style={{ width: "100%" }}>
                    {chatMessages.length === 0 ? (
                      <Empty description="No messages yet" />
                    ) : (
                      chatMessages.map((item) => {
                        const isMe = item.sender_role === user?.role && Number(item.sender_id) === Number(user?.id);
                        return (
                          <div key={item.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                            <div
                              style={{
                                maxWidth: "70%",
                                background: isMe ? "#1677ff" : colorBgContainer,
                                color: isMe ? "#fff" : colorText,
                                borderRadius: 10,
                                padding: "8px 10px",
                                border: isMe ? "none" : `1px solid ${colorBorderSecondary}`,
                              }}
                            >
                              <div>{item.message}</div>
                              <Text style={{ color: isMe ? "#dbeafe" : colorTextSecondary, fontSize: 11 }}>
                                {formatTime(item.created_at)}
                              </Text>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </Space>
                </div>

                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type your message..."
                    onPressEnter={handleSend}
                  />
                  <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={handleSend}>
                    Send
                  </Button>
                </Space.Compact>
              </Space>
            )}
          </Card>
        </div>
      </Space>
    </Card>
  );
}

export default ChatSupport;
