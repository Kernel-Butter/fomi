"use client";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import Icon from "../Icon";

const TABLET_QUERY = "(min-width: 640px) and (max-width: 1199px)";

// One retained control tree serves the sidebar, tablet drawer, and mobile panel.
export default function ResponsiveControls({ ref, type, active, children }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const [tablet, setTablet] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(TABLET_QUERY);
    function syncLayout() {
      const dialog = dialogRef.current;
      if (dialog.open) dialog.close();
      setTablet(query.matches);
      setExpanded(false);
      if (!query.matches) dialog.show();
    }
    syncLayout();
    query.addEventListener("change", syncLayout);
    return () => query.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    if (tablet && !active && dialogRef.current.open) dialogRef.current.close();
  }, [tablet, active]);

  function open() {
    if (!tablet || !active || dialogRef.current.open) return;
    dialogRef.current.showModal();
    setExpanded(true);
  }
  function close() {
    if (!tablet || !dialogRef.current.open) return;
    dialogRef.current.close();
    setExpanded(false);
    triggerRef.current?.focus({ preventScroll: true });
  }
  useImperativeHandle(ref, () => ({ open, close }));
  const label = type === "video" ? "Create video" : "Create image";
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="tablet-create-trigger"
        aria-haspopup="dialog"
        aria-controls={`${type}-controls`}
        aria-expanded={expanded}
        onClick={open}
      >
        <Icon name="sparkle" size={18} />
        <span>{label}</span>
        <Icon name="chevron" size={16} />
      </button>
      <dialog
        ref={dialogRef}
        id={`${type}-controls`}
        className="controls-container"
        role={tablet ? "dialog" : "presentation"}
        aria-label={tablet ? label : undefined}
        onClose={(event) => {
          if (event.target === event.currentTarget) setExpanded(false);
        }}
        onCancel={(event) => {
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (!tablet || event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close();
        }}
      >
        <div className="tablet-drawer-heading">
          <h2>{label}</h2>
          <button type="button" aria-label="Close create panel" onClick={close}>
            <Icon name="close" size={22} />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
