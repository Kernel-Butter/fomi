"use client";
import { ConfigProvider, Drawer } from "antd";
import CloseButton from "./CloseButton";
import useBelow992 from "../../hooks/useBelow992";

export default function StudioDrawer({
  title,
  closeLabel = "Close drawer",
  inline = false,
  hideHeader = false,
  children,
  ...props
}) {
  const below992 = useBelow992();
  const placement = below992 ? "bottom" : props.placement || "bottom";
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
        size="min(88dvh, 860px)"
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
          below992 && props.placement
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
            borderRadius: inline
              ? 0
              : placement === "left"
                ? "0 24px 24px 0"
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
