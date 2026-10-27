import {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import HistoryStrip from "./HistoryStrip";
import Icon from "../Icon";
import CloseButton from "../ui/CloseButton";
import { StudioNavigationContext } from "../layout/StudioNavigation";

export default function HistoryTray({ ref, type, groups, onSelect, active }) {
  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState(false);
  const contentRef = useRef(null);
  const stripRef = useRef(null);
  const toggleRef = useRef(null);
  const drawerToggleRef = useRef(null);
  const drawerRef = useRef(null);
  const baseline = useRef(0);
  const currentScroll = useRef(0);
  const { registerHistory } = useContext(StudioNavigationContext);
  const hasHistory = groups.length > 0;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1199px)");
    function sync() {
      if (drawerRef.current?.open) drawerRef.current.close();
      setDrawerMode(query.matches);
      setOpen(false);
    }
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!active && drawerRef.current?.open) {
      drawerRef.current.close();
      setOpen(false);
    }
  }, [active]);
  const expand = useCallback(() => {
    if (!active) return;
    baseline.current = currentScroll.current;
    if (drawerMode && drawerRef.current && !drawerRef.current.open)
      drawerRef.current.showModal();
    setOpen(true);
  }, [active, drawerMode]);
  function closeDrawer() {
    drawerRef.current?.close();
    setOpen(false);
    drawerToggleRef.current?.focus({ preventScroll: true });
  }
  useEffect(
    () =>
      registerHistory(type, () => {
        if (!hasHistory) return;
        expand();
        if (!drawerMode) requestAnimationFrame(() => stripRef.current?.focus());
      }),
    [registerHistory, type, hasHistory, expand, drawerMode],
  );
  useImperativeHandle(
    ref,
    () => ({
      handleFeedScroll(top) {
        currentScroll.current = top;
        baseline.current = Math.min(baseline.current, top);
        if (
          !drawerMode &&
          open &&
          top - baseline.current > 80 &&
          !contentRef.current?.contains(document.activeElement)
        )
          setOpen(false);
      },
    }),
    [open, drawerMode],
  );

  return (
    <>
      <div
        className={`history-reveal ${hasHistory ? "has-history" : ""}`}
        aria-hidden={!hasHistory || drawerMode}
        inert={!hasHistory || drawerMode ? true : undefined}
      >
        <div className="history-reveal-inner">
          {hasHistory && (
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
          )}
        </div>
      </div>
      {hasHistory && (
        <>
          <button
            ref={drawerToggleRef}
            type="button"
            className="compact-history-handle"
            aria-label="Show history"
            aria-haspopup="dialog"
            aria-expanded={open && drawerMode}
            aria-controls={`${type}-history-drawer`}
            onClick={expand}
          >
            <Icon name="previous" size={17} />
            <span>History</span>
          </button>
          <dialog
            ref={drawerRef}
            id={`${type}-history-drawer`}
            className="compact-history-drawer"
            aria-label={`${type === "video" ? "Video" : "Image"} history`}
            onClose={() => setOpen(false)}
            onCancel={(event) => {
              event.preventDefault();
              closeDrawer();
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
                closeDrawer();
            }}
          >
            <header className="compact-history-heading">
              <h2>History</h2>
              <CloseButton aria-label="Close history" onClick={closeDrawer} />
            </header>
            <div className="compact-history-list">
              {groups.map((group) => (
                <button
                  type="button"
                  className="compact-history-entry"
                  key={group.id}
                  onClick={() => {
                    closeDrawer();
                    onSelect(group.id);
                  }}
                  aria-label={`Open conversation: ${group.prompt}`}
                >
                  <span className="compact-history-thumbnail">
                    {group.items.slice(0, 3).map((item, index) => (
                      <span
                        key={item.id}
                        style={{ "--layer": index, zIndex: 3 - index }}
                      >
                        <Image
                          src={item.poster || item.src}
                          alt=""
                          fill
                          sizes="64px"
                          style={item.presentation}
                        />
                      </span>
                    ))}
                    <b>{group.items.length}</b>
                  </span>
                  <span className="compact-history-copy">
                    <strong>{group.prompt}</strong>
                    <small>
                      {group.model} · {group.items.length}{" "}
                      {type === "video" ? "videos" : "images"}
                    </small>
                  </span>
                  <Icon name="next" size={16} />
                </button>
              ))}
            </div>
          </dialog>
        </>
      )}
    </>
  );
}
