"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import HistoryTray from "../history/HistoryTray";
import ControlPanel from "../panel/ControlPanel";
import ResponsiveControls from "../panel/ResponsiveControls";
import ResultsFeed from "../results/ResultsFeed";
import useGenerations from "../../hooks/useGenerations";

export default function AppShell({ type, active }) {
  const [prompt, setPrompt] = useState("");
  const [currentId, setCurrentId] = useState(null);
  const resultsRef = useRef(null);
  const promptRef = useRef(null);
  const controlsRef = useRef(null);
  const historyRef = useRef(null);
  const groupElements = useRef(new Map());
  const savedScroll = useRef(0);
  const handledScroll = useRef(null);
  const {
    groups,
    history,
    retry,
    retryHistory,
    announcement,
    error,
    historyRetryLabel,
    loading,
    scrollRequest,
    create,
    loadHistory,
  } = useGenerations(type);
  const historyGroups = history;
  const registerGroup = useCallback((id, element) => {
    if (element) groupElements.current.set(id, element);
    else groupElements.current.delete(id);
  }, []);
  const chooseSample = useCallback((value) => {
    setPrompt(value);
    controlsRef.current?.open();
    requestAnimationFrame(() => promptRef.current?.focus());
  }, []);

  useEffect(() => {
    const feed = resultsRef.current;
    if (!active || !feed) return;
    function updateCurrent() {
      const bounds = feed.getBoundingClientRect();
      let best = null;
      let largest = 0;
      for (const [id, element] of groupElements.current) {
        const rect = element.getBoundingClientRect();
        const visible = Math.max(
          0,
          Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top),
        );
        if (visible > largest) {
          best = id;
          largest = visible;
        }
      }
      if (
        feed.scrollTop > 0 &&
        feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 2
      )
        best = groups.at(-1)?.id ?? best;
      setCurrentId(best);
    }
    const observer = new ResizeObserver(updateCurrent);
    observer.observe(feed);
    for (const element of groupElements.current.values())
      observer.observe(element);
    feed.addEventListener("scroll", updateCurrent, { passive: true });
    updateCurrent();
    return () => {
      observer.disconnect();
      feed.removeEventListener("scroll", updateCurrent);
    };
  }, [active, groups]);

  useEffect(() => {
    if (!active || !resultsRef.current) return;
    resultsRef.current.scrollTop = savedScroll.current;
    if (!scrollRequest || handledScroll.current === scrollRequest) return;
    const frame = requestAnimationFrame(() => {
      const feed = resultsRef.current;
      const group = groupElements.current.get(scrollRequest.id);
      if (!feed || !group) return;
      handledScroll.current = scrollRequest;
      const top =
        scrollRequest.mode === "bottom"
          ? feed.scrollHeight
          : feed.scrollTop +
            group.getBoundingClientRect().top -
            feed.getBoundingClientRect().top -
            4;
      feed.scrollTo({
        top,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [active, scrollRequest]);

  return (
    <div id={`${type}-studio`} className="app-shell studio-shell">
      <HistoryTray
        active={active}
        ref={historyRef}
        type={type}
        groups={historyGroups}
        currentId={currentId}
        onSelect={loadHistory}
      />
      <div className="workspace">
        <ResponsiveControls ref={controlsRef} type={type} active={active}>
          <ControlPanel
            promptRef={promptRef}
            active={active}
            type={type}
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            onGenerate={(options) => {
              controlsRef.current?.close();
              return create(options);
            }}
          />
        </ResponsiveControls>
        <main
          id={`${type}-results`}
          ref={resultsRef}
          className="results-scroll"
          tabIndex={0}
          aria-label="Generation conversation and results"
          onScroll={(event) => {
            if (!active || event.target !== event.currentTarget) return;
            savedScroll.current = event.currentTarget.scrollTop;
            historyRef.current?.handleFeedScroll(savedScroll.current);
          }}
        >
          <ResultsFeed
            onRetry={retry}
            onRetryHistory={retryHistory}
            busy={loading}
            registerGroup={registerGroup}
            active={active}
            type={type}
            groups={groups}
            onSample={chooseSample}
            error={error}
            historyRetryLabel={historyRetryLabel}
          />
        </main>
      </div>
      <div
        className="sr-only"
        role="status"
        aria-label="Generation updates"
        aria-live="polite"
      >
        {announcement}
      </div>
    </div>
  );
}
