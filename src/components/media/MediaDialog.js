"use client";
import { useContext, useEffect, useRef } from "react";
import StudioDrawer from "../ui/StudioDrawer";
import useCompactLayout from "../../hooks/useCompactLayout";
import {
  RouteNavigationContext,
  RouteProgress,
} from "../navigation/RouteProgressProvider";

// This layout-level dialog stays mounted while the selected media route changes.
export default function MediaDialog({ children }) {
  const router = useContext(RouteNavigationContext);
  const dialogRef = useRef(null);
  const compactLayout = useCompactLayout();
  useEffect(() => {
    const previousFocus = document.activeElement;
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        requestAnimationFrame(() =>
          previousFocus.focus({ preventScroll: true }),
        );
      }
    };
  }, []);
  useEffect(() => {
    if (compactLayout) return;
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [compactLayout]);
  if (compactLayout)
    return (
      <StudioDrawer
        title="Media preview"
        hideHeader
        aria-labelledby="media-modal-title"
        open
        onClose={() => router.back()}
        rootClassName="media-preview-drawer"
      >
        <RouteProgress />
        {children}
      </StudioDrawer>
    );
  return (
    <dialog
      ref={dialogRef}
      className="media-preview-modal"
      aria-labelledby="media-modal-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [
          ...event.currentTarget.querySelectorAll(
            "button:not([disabled]),a[href],video[controls]",
          ),
        ].filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last &&
          last?.tagName !== "VIDEO"
        ) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        router.back();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          router.back();
      }}
    >
      <RouteProgress />
      {children}
    </dialog>
  );
}
