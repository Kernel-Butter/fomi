"use client";
import { ConfigProvider, Drawer } from "antd";
import CloseButton from "./CloseButton";
import useCompactLayout from "../../hooks/useCompactLayout";

export default function StudioDrawer({
  title,
  closeLabel = "Close drawer",
  inline = false,
  hideHeader = false,
  square = false,
  compactPlacement = "bottom",
  children,
  ...props
}) {
  const compactLayout = useCompactLayout();
  const placement = compactLayout
    ? compactPlacement
    : props.placement || "bottom";
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#b7745d",
          colorBgElevated: "#fcf7f2",
          colorText: "#403630",
          colorLink: "#674b3b",
          fontFamily: "inherit",
          borderRadiusLG: 24,
        },
      }}
    >
      <Drawer
        destroyOnHidden={false}
        push={false}
        mask={!inline}
        autoFocus={!inline}
        focusable={{ trap: !inline, focusTriggerAfterClose: !inline }}
        keyboard={!inline}
        role={inline ? "presentation" : "dialog"}
        aria-modal={!inline}
        closable={false}
        aria-label={title}
        {...props}
        placement={placement}
        size={
          compactLayout && placement === "bottom" && props.placement
            ? "min(88dvh, 860px)"
            : props.size || "min(88dvh, 860px)"
        }
        rootClassName={
          (props.rootClassName || "") +
          (inline ? " studio-drawer-inline" : " studio-drawer")
        }
        title={inline || hideHeader ? undefined : title}
        extra={
          inline || hideHeader ? undefined : (
            <div className="studio-drawer-title">
              <CloseButton aria-label={closeLabel} onClick={props.onClose} />
            </div>
          )
        }
        styles={{
          header: { padding: "12px 18px", borderBottom: "1px solid #ecdccf" },
          body: {
            padding: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          },
          section: {
            borderRadius:
              inline || square
                ? 0
                : placement === "left"
                  ? "0 24px 24px 0"
                  : placement === "right"
                    ? "24px 0 0 24px"
                    : "24px 24px 0 0",
            overflow: "hidden",
          },
          ...(inline
            ? {
                root: { position: "static", height: "100%" },
                wrapper: {
                  position: "static",
                  height: "100%",
                  width: "100%",
                  transform: "none",
                  boxShadow: "none",
                },
              }
            : {}),
        }}
      >
        {children}
      </Drawer>
    </ConfigProvider>
  );
}
