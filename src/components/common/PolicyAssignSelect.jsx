import { Select } from "antd";

function PolicyAssignSelect({ policies = [], value, onChange, placeholder = "Select a policy", loading = false }) {
  return (
    <Select
      showSearch
      allowClear
      loading={loading}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      optionFilterProp="label"
      options={policies.map((policy) => ({
        label: policy.name,
        value: policy.id,
        description: policy.description,
      }))}
      optionRender={(option) => (
        <div>
          <div>{option.label}</div>
          {option.data.description ? (
            <div style={{ fontSize: 12, color: "var(--papertech-text-muted)" }}>{option.data.description}</div>
          ) : null}
        </div>
      )}
      style={{ width: "100%" }}
    />
  );
}

export default PolicyAssignSelect;
