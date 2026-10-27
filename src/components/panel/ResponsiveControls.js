"use client";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import StudioDrawer from "../ui/StudioDrawer";
import Icon from "../Icon";

// Keep the same controls mounted while switching between sidebar and drawer.
export default function ResponsiveControls({ ref, type, active, children }) {
  const triggerRef = useRef(null);
  const [drawerMode, setDrawerMode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1199px)");
    function sync() {
      setDrawerMode(query.matches);
      setExpanded(false);
    }
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  function close() {
    setExpanded(false);
  }
  useImperativeHandle(ref, () => ({
    open() {
      if (drawerMode && active) setExpanded(true);
    },
    close,
  }));
  const label = type === "video" ? "Create video" : "Create image";
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="tablet-create-trigger"
        aria-haspopup="dialog"
        aria-controls={type + "-controls"}
        aria-expanded={expanded && active}
        onClick={() => setExpanded(true)}
      >
        <Icon name="sparkle" size={18} />
        <span>{label}</span>
        <Icon name="chevron" size={16} />
      </button>
      <StudioDrawer
        title={label}
        closeLabel="Close create panel"
        open={!drawerMode || (expanded && active)}
        onClose={close}
        inline={!drawerMode}
        rootClassName="generation-drawer"
        getContainer={false}
        focusable={{ trap: drawerMode, focusTriggerAfterClose: false }}
        afterOpenChange={(isOpen) => {
          if (!isOpen && active)
            triggerRef.current?.focus({ preventScroll: true });
        }}
      >
        <div id={type + "-controls"} className="controls-container">
          {children}
        </div>
      </StudioDrawer>
    </>
  );
}
