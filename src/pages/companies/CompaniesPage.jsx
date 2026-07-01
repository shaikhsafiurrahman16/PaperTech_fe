import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Typography, App, Tag } from 'antd';
import api from '../../api/axiosConfig';
import PageHeader from '../../components/layout/PageHeader';

const { Title } = Typography;

function CompaniesPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies');
      setCompanies(response.data?.data || []);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreate = async (values) => {
    try {
      setSaving(true);
      await api.post('/companies', values);
      message.success('Company created successfully');
      form.resetFields();
      setCreateOpen(false);
      loadCompanies();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create company');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (company) => {
    setEditingCompany(company);
    editForm.setFieldsValue({
      name: company.name,
      code: company.code,
      address: company.address || '',
      phone: company.phone || '',
      status: company.status,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (values) => {
    try {
      setSaving(true);
      await api.put(`/companies/${editingCompany.id}`, values);
      message.success('Company updated successfully');
      setEditOpen(false);
      setEditingCompany(null);
      loadCompanies();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/companies/${id}`);
      message.success('Company deleted successfully');
      loadCompanies();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete company');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value) => (
        <Tag color={value === 'active' ? 'green' : 'default'} style={{ borderRadius: 999, paddingInline: 10 }}>
          {String(value || '').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Space size={8}>
          <Button size="small" type="default" onClick={() => openEdit(row)}>Edit</Button>
          <Popconfirm title="Delete company?" onConfirm={() => handleDelete(row.id)}>
            <Button size="small" danger ghost>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Companies"
        description="Manage company records and their admin accounts."
        actions={[
          <Button key="create" type="primary" size="large" style={{ borderRadius: 10, fontWeight: 600 }} onClick={() => setCreateOpen(true)}>
            Create Company
          </Button>,
        ]}
      />
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={companies}
          loading={loading}
          pagination={false}
          size="middle"
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      <Modal title="Create Company + Admin" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} centered>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Company Name" rules={[{ required: true, message: 'Company name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Company Code" rules={[{ required: true, message: 'Company code is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="admin_full_name" label="Company Admin Name" rules={[{ required: true, message: 'Admin name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="admin_username" label="Company Admin Username" rules={[{ required: true, message: 'Admin username is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="admin_password" label="Company Admin Password" rules={[{ required: true, message: 'Admin password is required' }, { min: 6, message: 'Min 6 chars' }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} size="large" style={{ width: '100%', borderRadius: 10, fontWeight: 600 }}>
            Create Company
          </Button>
        </Form>
      </Modal>

      <Modal title="Edit Company" open={editOpen} onCancel={() => setEditOpen(false)} footer={null} centered>
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="name" label="Company Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="Company Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label="Address"><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}><Input /></Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} size="large" style={{ width: '100%', borderRadius: 10, fontWeight: 600 }}>
            Update Company
          </Button>
        </Form>
      </Modal>
    </Space>
  );
}

export default CompaniesPage;
