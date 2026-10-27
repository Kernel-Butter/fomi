import {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import HistoryStrip from "./HistoryStrip";
import Icon from "../Icon";
import { StudioNavigationContext } from "../layout/StudioNavigation";

export default function HistoryTray({ ref, type, groups, onSelect }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const stripRef = useRef(null);
  const toggleRef = useRef(null);
  const baseline = useRef(0);
  const currentScroll = useRef(0);
  const { registerHistory } = useContext(StudioNavigationContext);
  const hasHistory = groups.length > 0;

  const expand = useCallback(() => {
    baseline.current = currentScroll.current;
    setOpen(true);
  }, []);
  useEffect(
    () =>
      registerHistory(type, () => {
        if (!hasHistory) return;
        expand();
        requestAnimationFrame(() => stripRef.current?.focus());
      }),
    [registerHistory, type, hasHistory, expand],
  );

  useImperativeHandle(
    ref,
    () => ({
      handleFeedScroll(top) {
        currentScroll.current = top;
        baseline.current = Math.min(baseline.current, top);
        if (
          open &&
          top - baseline.current > 80 &&
          !contentRef.current?.contains(document.activeElement)
        )
          setOpen(false);
      },
    }),
    [open],
  );

  if (!hasHistory) return null;
  return (
    <div className={`history-tray ${open ? "is-open" : ""}`}>
      <div
        id={`${type}-history-tray`}
        ref={contentRef}
        className="history-tray-body"
        inert={!open ? true : undefined}
      >
        <div className="history-tray-content">
          <HistoryStrip
            type={type}
            historyGroups={groups}
            onSelect={onSelect}
            stripRef={stripRef}
          />
        </div>
      </div>
      <div className="history-tray-toolbar">
        <button
          ref={toggleRef}
          type="button"
          className="history-tray-toggle"
          aria-expanded={open}
          aria-controls={`${type}-history-tray`}
          aria-label={open ? "Collapse history" : "Show history"}
          onClick={() => {
            if (open) {
              setOpen(false);
              toggleRef.current?.focus();
            } else expand();
          }}
        >
          <span>History</span>
          <Icon name="chevron" size={15} />
        </button>
      </div>
    </div>
  );
}
