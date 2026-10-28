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
import StudioDrawer from "../ui/StudioDrawer";
import { StudioNavigationContext } from "../layout/StudioNavigation";
import useHistoryScroll from "../../hooks/useHistoryScroll";

export default function HistoryTray({
  ref,
  type,
  groups,
  onSelect,
  active,
  currentId,
}) {
  const [open, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState(false);
  const [drawerReady, setDrawerReady] = useState(false);
  const contentRef = useRef(null);
  const stripRef = useRef(null);
  const listRef = useRef(null);
  const { before, after, slide } = useHistoryScroll(
    listRef,
    currentId,
    open && drawerMode && drawerReady,
    true,
  );
  const toggleRef = useRef(null);
  const drawerToggleRef = useRef(null);
  const baseline = useRef(0);
  const currentScroll = useRef(0);
  const { registerHistory } = useContext(StudioNavigationContext);
  const hasHistory = groups.length > 0;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 800px)");
    function sync() {
      setDrawerMode(query.matches);
      setOpen(false);
    }
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);
  const expand = useCallback(() => {
    if (!active) return;
    baseline.current = currentScroll.current;
    setOpen(true);
  }, [active]);
  function closeDrawer() {
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
                    currentId={currentId}
                    open={!drawerMode}
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
          <StudioDrawer
            title={type === "video" ? "Video history" : "Image history"}
            hideHeader
            placement="right"
            size="min(340px, calc(100vw - 28px))"
            rootClassName="history-drawer"
            open={open && drawerMode && active}
            onClose={closeDrawer}
            focusable={{ trap: true, focusTriggerAfterClose: false }}
            afterOpenChange={(isOpen) => {
              setDrawerReady(isOpen);
              if (!isOpen && active)
                drawerToggleRef.current?.focus({ preventScroll: true });
            }}
          >
            <div
              id={type + "-history-drawer"}
              className="history-drawer-content"
            >
              <header className="compact-history-heading">
                <h2>History</h2>
                <CloseButton aria-label="Close history" onClick={closeDrawer} />
              </header>
              {before && (
                <button
                  type="button"
                  className="history-slide history-slide-vertical"
                  aria-label="Previous history"
                  onClick={() => slide(-1)}
                >
                  <Icon name="chevron" size={16} />
                </button>
              )}
              <div className="compact-history-list" ref={listRef}>
                {groups.map((group) => (
                  <button
                    type="button"
                    className={`compact-history-entry ${currentId === group.id ? "is-current" : ""}`}
                    data-history-id={group.id}
                    aria-current={currentId === group.id ? "true" : undefined}
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
              {after && (
                <button
                  type="button"
                  className="history-slide history-slide-vertical is-next"
                  aria-label="Next history"
                  onClick={() => slide(1)}
                >
                  <Icon name="chevron" size={16} />
                </button>
              )}
            </div>
          </StudioDrawer>
        </>
      )}
    </>
  );
}
