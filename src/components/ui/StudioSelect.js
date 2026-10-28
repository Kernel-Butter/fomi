"use client";
import { ConfigProvider, Select } from "antd";
import Icon from "../Icon";
import useCompactLayout from "../../hooks/useCompactLayout";
export default function StudioSelect({ options, ...props }) {
  const compact = useCompactLayout();
  const fontSize = compact ? 14 : 12;
  return (
    <ConfigProvider
      theme={{
        token: {
          fontSize,
          fontFamily: "inherit",
          controlHeight: compact ? 44 : 36,
          colorBorder: "#e6d7cd",
        },
        components: {
          Select: {
            activeBorderColor: "#a85d49",
            activeOutlineColor: "transparent",
            optionFontSize: fontSize,
            optionHeight: compact ? 44 : 36,
            optionSelectedBg: "#f4e6e1",
            optionSelectedColor: "#403630",
          },
        },
      }}
    >
      <Select
        {...props}
        options={options}
        className="studio-select"
        classNames={{ popup: { root: "studio-select-popup" } }}
        styles={{
          root: { width: "100%", fontSize },
          popup: {
            root: { fontSize, fontFamily: "inherit", borderRadius: 0 },
            listItem: { fontSize, borderRadius: 0 },
          },
        }}
        showSearch={false}
        virtual={false}
        getPopupContainer={(trigger) =>
          trigger.closest(".ant-drawer-section") || document.body
        }
        suffixIcon={<Icon name="chevron" size={14} />}
      />
    </ConfigProvider>
  );
}
