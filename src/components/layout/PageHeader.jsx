import { Card, Space, Typography } from "antd";

function PageHeader({ title, description, actions }) {
  return (
    <Card
      bordered={false}
      style={{
        marginBottom: 24,
        borderRadius: 20,
        background: "linear-gradient(135deg, rgba(91, 82, 217, 0.12), rgba(16, 185, 129, 0.08))",
      }}
    >
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Text type="secondary">{description}</Typography.Text>
          ) : null}
        </div>
        {actions ? (
          <Space wrap style={{ justifyContent: "flex-end" }}>
            {actions}
          </Space>
        ) : null}
      </Space>
    </Card>
  );
}

export default PageHeader;
