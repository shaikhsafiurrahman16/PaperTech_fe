import { Card, Space, Typography } from "antd";

function PageHeader({ title, description, actions }) {
  return (
    <Card
      className="papertech-glass papertech-fade-in"
      bordered={false}
      style={{
        marginBottom: 24,
        borderRadius: 20,
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--papertech-primary) 14%, var(--papertech-surface-strong)) 0%, color-mix(in srgb, var(--papertech-success) 10%, var(--papertech-surface-strong)) 100%)",
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
