import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
} from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import api from "../../services/apiClient";
import PageHeader from "../../components/layout/PageHeader";
import PolicySelect from "../../components/common/PolicySelect";
import { ACCESS_ACTIONS, ACCESS_MODULES, getActionsForModule, getModulesForPolicyCreator } from "../../lib/accessModules";

function PoliciesPage() {
  const { message } = App.useApp();
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "super_admin";
  const [form] = Form.useForm();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const modules = useMemo(() => getModulesForPolicyCreator(user?.role), [user?.role]);

  const moduleLabelByKey = useMemo(() => {
    return ACCESS_MODULES.reduce((labels, moduleItem) => {
      labels[moduleItem.key] = moduleItem.label;
      getActionsForModule(moduleItem.key).forEach((actionKey) => {
        const action = ACCESS_ACTIONS.find((item) => item.key === actionKey);
        labels[`${moduleItem.key}.${actionKey}`] = `${action?.label || actionKey} ${moduleItem.label}`;
      });
      return labels;
    }, {});
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response = await api.get("/policies");
      setPolicies(response.data?.data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const openCreate = () => {
    setEditingPolicy(null);
    form.resetFields();
    form.setFieldsValue({ allowed_modules: [] });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingPolicy(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description || "",
      allowed_modules: record.allowed_modules || [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      const payload = {
        name: values.name,
        description: values.description || null,
        allowed_modules: values.allowed_modules || [],
      };

      if (editingPolicy) {
        await api.put(`/policies/${editingPolicy.id}`, payload);
        message.success("Policy updated successfully");
      } else {
        await api.post("/policies", payload);
        message.success("Policy created successfully");
      }

      setModalOpen(false);
      form.resetFields();
      setEditingPolicy(null);
      loadPolicies();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/policies/${id}`);
      message.success("Policy deleted successfully");
      loadPolicies();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete policy");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Permissions",
      dataIndex: "allowed_modules",
      key: "allowed_modules",
      render: (value = []) => (
        <Space size={[6, 6]} wrap>
          {value.slice(0, 4).map((permission) => (
            <Tag key={permission}>{moduleLabelByKey[permission] || permission}</Tag>
          ))}
          {value.length > 4 ? <Tag>+{value.length - 4} more</Tag> : null}
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete policy?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader
        title="Policies"
        description={
          isSuperAdmin
            ? "Create policy templates for company admins. Only your policies are visible here."
            : "Create policy templates for your company users. Only your company policies are visible here."
        }
        actions={[
          <Button key="create" type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>
            Create Policy
          </Button>,
        ]}
      />

      <Card>
        <Table rowKey="id" columns={columns} dataSource={policies} loading={loading} pagination={false} />
      </Card>

      <Modal
        title={editingPolicy ? "Edit Policy" : "Create Policy"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        centered
        width={720}
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit}>
          <Form.Item name="name" label="Policy Name" rules={[{ required: true, message: "Policy name is required" }]}>
            <Input placeholder="e.g. Sales Staff" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Short description of this policy" />
          </Form.Item>
          <Form.Item
            name="allowed_modules"
            label="Permissions"
            rules={[{ required: true, message: "Select at least one permission" }]}
          >
            <PolicySelect modules={modules} placeholder="Select permissions for this policy" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} block size="large">
            Save Policy
          </Button>
        </Form>
      </Modal>
    </Space>
  );
}

export default PoliciesPage;
