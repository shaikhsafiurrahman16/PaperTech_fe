import { Button, Divider, Select, Space } from "antd";
import { ACCESS_ACTIONS, getActionsForModule } from "../../utils/accessModules";

function PolicySelect({ modules = [], value = [], onChange, placeholder = "Select policies" }) {
  const permissionKeys = modules.flatMap((moduleItem) =>
    getActionsForModule(moduleItem.key).map((actionKey) => `${moduleItem.key}.${actionKey}`),
  );
  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <Select
      mode="multiple"
      allowClear
      showSearch
      value={selectedValues}
      onChange={onChange}
      placeholder={placeholder}
      maxTagCount="responsive"
      optionFilterProp="label"
      notFoundContent="No policies available"
      dropdownRender={(menu) => (
        <>
          <Space style={{ width: "100%", justifyContent: "space-between", padding: "8px 10px 4px" }}>
            <Button type="link" size="small" onClick={() => onChange?.(permissionKeys)}>
              Select All
            </Button>
            <Button type="link" size="small" onClick={() => onChange?.([])}>
              Clear
            </Button>
          </Space>
          <Divider style={{ margin: "4px 0" }} />
          {menu}
        </>
      )}
      options={modules.map((moduleItem) => ({
        label: moduleItem.label,
        options: getActionsForModule(moduleItem.key).map((actionKey) => {
          const action = ACCESS_ACTIONS.find((item) => item.key === actionKey);
          return {
            label: `${action?.label || actionKey} ${moduleItem.label}`,
            value: `${moduleItem.key}.${actionKey}`,
          };
        }),
      }))}
      style={{ width: "100%" }}
    />
  );
}

export default PolicySelect;
