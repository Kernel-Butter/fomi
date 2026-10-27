"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import HistoryTray from "../history/HistoryTray";
import ControlPanel from "../panel/ControlPanel";
import ResultsFeed from "../results/ResultsFeed";
import useGenerations from "../../hooks/useGenerations";

export default function AppShell({ type, active }) {
  const [prompt, setPrompt] = useState("");
  const resultsRef = useRef(null);
  const promptRef = useRef(null);
  const historyRef = useRef(null);
  const groupElements = useRef(new Map());
  const savedScroll = useRef(0);
  const handledScroll = useRef(null);
  const {
    groups,
    announcement,
    error,
    loading,
    scrollRequest,
    create,
    loadHistory,
  } = useGenerations();
  const historyGroups = groups
    .slice()
    .reverse()
    .filter((group) => !group.loading && group.items.length > 0);
  const registerGroup = useCallback((id, element) => {
    if (element) groupElements.current.set(id, element);
    else groupElements.current.delete(id);
  }, []);
  const chooseSample = useCallback((value) => {
    setPrompt(value);
    promptRef.current?.focus();
  }, []);

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
        ref={historyRef}
        type={type}
        groups={historyGroups}
        onSelect={loadHistory}
      />
      <div className="workspace">
        <ControlPanel
          promptRef={promptRef}
          active={active}
          type={type}
          prompt={prompt}
          setPrompt={setPrompt}
          loading={loading}
          onGenerate={create}
        />
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
            registerGroup={registerGroup}
            active={active}
            type={type}
            groups={groups}
            onSample={chooseSample}
            error={error}
          />
        </main>
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
