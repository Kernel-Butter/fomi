"use client";
import { useContext, useEffect, useRef, useState } from "react";
import {
  getConversation,
  getHistory,
  getJob,
  pollDelay,
  retryJob,
  submitGeneration,
} from "../lib/api";
import { StudioBackendContext } from "../components/layout/StudioBackend";

export default function useGenerations(type) {
  const { sessionId, config } = useContext(StudioBackendContext);
  const [groups, setGroups] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState("");
  const [scrollRequest, setScrollRequest] = useState(null);
  const pending = useRef(false);
  const controller = useRef(null);
  const historyController = useRef(null);
  const failedConversation = useRef(null);
  const historyListController = useRef(null);

  useEffect(() => {
    const initial = new AbortController();
    historyListController.current = initial;
    getHistory(sessionId, type, initial.signal)
      .then((data) => setHistory(data.history))
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => {
      initial.abort();
      controller.current?.abort();
      historyController.current?.abort();
      historyListController.current?.abort();
    };
  }, [sessionId, type]);

  function update(job) {
    setGroups((previous) =>
      previous.map((group) =>
        group.id === job.id ? { ...group, ...job } : group,
      ),
    );
  }
  async function refreshHistory(signal) {
    historyListController.current?.abort();
    const abort = new AbortController();
    historyListController.current = abort;
    const data = await getHistory(
      sessionId,
      type,
      signal ? AbortSignal.any([signal, abort.signal]) : abort.signal,
    );
    setHistory(data.history);
  }
  async function run(group, retry = false) {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError("");
    failedConversation.current = null;
    setAnnouncement(retry ? "Retry started." : "Generation started.");
    const abort = new AbortController();
    controller.current = abort;
    const operationSignal = AbortSignal.any([
      abort.signal,
      AbortSignal.timeout(120000),
    ]);
    update({
      id: group.id,
      loading: true,
      status: "queued",
      progress: 0,
      error: "",
    });
    setScrollRequest({ id: group.id, mode: "bottom" });
    try {
      let job;
      if (retry && group.remote) {
        ({ job } = await getJob(sessionId, group.id, operationSignal));
        if (job.status === "failed")
          ({ job } = await retryJob(sessionId, group.id, operationSignal));
      } else {
        ({ job } = await submitGeneration(
          sessionId,
          {
            prompt: group.prompt,
            count: group.count,
            ratio: group.ratio,
            model: group.model,
            type,
            advanced: group.advanced,
            requestId: group.id,
          },
          operationSignal,
        ));
      }
      if (retry && job.status === "failed" && !group.remote)
        ({ job } = await retryJob(sessionId, job.id, operationSignal));
      update({ ...job, remote: true });
      while (job.loading) {
        await pollDelay(config.pollingInterval, operationSignal);
        ({ job } = await getJob(sessionId, job.id, operationSignal));
        update({ ...job, remote: true });
      }
      if (job.status === "failed") {
        setAnnouncement("Generation failed. You can retry this conversation.");
      } else {
        setAnnouncement(
          `${job.items.length} ${type === "video" ? "videos" : "images"} ready.`,
        );
        try {
          await refreshHistory(abort.signal);
        } catch (historyError) {
          if (historyError.name !== "AbortError")
            setError(
              "Your results are ready, but history could not be refreshed. Please retry.",
            );
        }
      }
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        update({
          id: group.id,
          loading: false,
          status: "failed",
          error:
            requestError.name === "TimeoutError"
              ? "This generation is taking longer than expected. Retry to check its progress; your prompt is saved."
              : requestError.message,
        });
        setAnnouncement(
          "Generation interrupted. Your prompt is saved; please retry.",
        );
      }
    } finally {
      if (!abort.signal.aborted) setLoading(false);
      pending.current = false;
    }
  }
  function create(options) {
    if (pending.current || !options.prompt.trim()) return;
    const group = {
      ...options,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      type,
      loading: true,
      status: "queued",
      progress: 0,
      items: [],
      remote: false,
    };
    setGroups((previous) => [...previous, group]);
    return run(group);
  }
  function retry(id) {
    const group = groups.find((value) => value.id === id);
    if (group) return run(group, true);
  }
  async function loadHistory(id) {
    historyController.current?.abort();
    const abort = new AbortController();
    historyController.current = abort;
    setError("");
    failedConversation.current = null;
    try {
      const { group } = await getConversation(sessionId, id, abort.signal);
      setGroups((previous) =>
        previous.some((value) => value.id === id)
          ? previous.map((value) =>
              value.id === id ? { ...group, remote: true } : value,
            )
          : [...previous, { ...group, remote: true }].sort(
              (a, b) => a.createdAt - b.createdAt,
            ),
      );
      setScrollRequest({ id, mode: "conversation" });
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        failedConversation.current = id;
        setError(requestError.message);
      }
    }
  }
  async function retryHistory() {
    if (failedConversation.current)
      return loadHistory(failedConversation.current);
    setError("");
    try {
      await refreshHistory();
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message);
    }
  }
  return {
    groups,
    history,
    loading,
    announcement,
    error,
    historyRetryLabel: failedConversation.current
      ? "Retry opening conversation"
      : "Refresh history",
    scrollRequest,
    create,
    retry,
    retryHistory,
    loadHistory,
  };
}
