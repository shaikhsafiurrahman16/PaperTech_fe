import { useEffect, useState } from "react";
import { App, Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag } from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../services/apiClient";
import PageHeader from "../../components/layout/PageHeader";
import PolicyAssignSelect from "../../components/common/PolicyAssignSelect";
import usePermissions from "../../hooks/usePermissions";

function CompanyUsersPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [userPolicies, setUserPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { canCreate, canUpdate, canDelete } = usePermissions("users");

  const loadPolicies = async () => {
    try {
      setPoliciesLoading(true);
      const response = await api.get("/policies");
      setUserPolicies(response.data?.data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to load policies");
    } finally {
      setPoliciesLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const usersResponse = await api.get("/users");
      setUsers(usersResponse.data?.data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadPolicies();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ username: "", password: "" });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      full_name: record.full_name,
      email: record.email || "",
      cnic: record.cnic || "",
      address: record.address || "",
      username: record.username,
      password: "",
      policy_id: record.policy_id || undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      const payload = { ...values };

      if (editingUser && !payload.password) {
        delete payload.password;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        message.success("User updated successfully");
      } else {
        await api.post("/users", payload);
        message.success("User created successfully");
      }

      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success("User deleted successfully");
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "full_name", key: "full_name" },
    { title: "Email", dataIndex: "email", key: "email", render: (value) => value || "-" },
    { title: "CNIC", dataIndex: "cnic", key: "cnic", render: (value) => value || "-" },
    { title: "Username", dataIndex: "username", key: "username" },
    {
      title: "Policy",
      key: "policy",
      render: (_, record) => (
        <Tag color="blue">{record.policy_name || "Custom / Unassigned"}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 140,
      render: (_, record) => (
        <Space>
          {canUpdate ? <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} /> : null}
          {canDelete ? (
            <Popconfirm title="Delete user?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader
        title="Users"
        description="Create company users and assign policies from templates."
        actions={[
          canCreate ? (
            <Button key="create" type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>
              Create User
            </Button>
          ) : null,
        ]}
      />

      <Card>
        <Table rowKey="id" columns={columns} dataSource={users} loading={loading} pagination={false} />
      </Card>

      <Modal
        title={editingUser ? "Edit User" : "Create User"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        centered
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit} autoComplete="off">
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: "Full name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Enter a valid email" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="cnic"
            label="CNIC"
            rules={[{ pattern: /^\d{1,13}$/, message: "CNIC must be digits only and maximum 13 digits" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: "Username is required" }]}>
            <Input autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? "New Password" : "Password"}
            rules={editingUser ? [] : [{ required: true, message: "Password is required" }, { min: 6, message: "Min 6 chars" }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="policy_id"
            label="Policy"
            rules={[{ required: true, message: "Select a policy" }]}
          >
            <PolicyAssignSelect policies={userPolicies} loading={policiesLoading} placeholder="Select user policy" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} block size="large">
            Save User
          </Button>
        </Form>
      </Modal>
    </Space>
  );
}

export default CompanyUsersPage;
