import { randomUUID } from "node:crypto";
import { isValidGenerationRequest } from "../generationValidation.js";
import { defaultSettings, ServiceError } from "./store.js";
import { durationFor, makeOutputs, resolveGeneration } from "./simulator.js";

export function saveSettings(session, type, value) {
  if (
    !value ||
    !isValidGenerationRequest({
      ...value.options,
      prompt: "Settings validation",
      type,
      advanced: value.advanced,
    }) ||
    !value.advanced
  )
    throw new ServiceError(400, "Please check your generation settings.");
  session.settings[type] = structuredClone(value);
  return session.settings[type];
}
export function resetSettings(session, type) {
  session.settings[type].advanced = defaultSettings().advanced;
  return session.settings[type];
}
export function readJob(session, id) {
  const job = session.jobs.get(id);
  if (!job)
    throw new ServiceError(
      404,
      "This generation was not found in your session.",
    );
  const elapsed = Date.now() - job.startedAt;
  if (job.status !== "completed" && job.status !== "failed") {
    job.progress = Math.min(99, Math.floor((elapsed / job.duration) * 100));
    job.status = elapsed < 250 ? "queued" : "processing";
    if (elapsed >= job.duration) {
      if (job.failOnce && job.attempt === 1) {
        job.status = "failed";
        job.error = "The generation could not be completed. Please retry.";
        job.progress = 0;
      } else {
        job.status = "completed";
        job.progress = 100;
        job.items = makeOutputs(job);
        job.completedAt = Date.now();
        job.error = "";
      }
    }
  }
  const {
    failOnce: _failOnce,
    duration: _duration,
    startedAt: _startedAt,
    ...publicJob
  } = job;
  return {
    ...publicJob,
    loading: job.status === "queued" || job.status === "processing",
  };
}
export function submitJob(session, data, failOnce = false) {
  if (!isValidGenerationRequest(data))
    throw new ServiceError(400, "Please check your generation options.");
  if (data.requestId !== undefined && !/^[0-9a-f-]{36}$/i.test(data.requestId))
    throw new ServiceError(400, "Invalid generation request ID.");
  const id = data.requestId || randomUUID();
  if (session.jobs.has(id)) return readJob(session, id);
  if (session.jobs.size >= 500)
    throw new ServiceError(
      429,
      "This demo session is full. Refresh to start a new one.",
    );
  const options = resolveGeneration({
    prompt: data.prompt,
    count: data.count,
    ratio: data.ratio,
    model: data.model,
    type: data.type,
    advanced: data.advanced ?? session.settings[data.type].advanced,
  });
  const now = Date.now();
  session.jobs.set(id, {
    ...options,
    id,
    createdAt: now,
    startedAt: now,
    duration: durationFor(options),
    status: "queued",
    progress: 0,
    attempt: 1,
    items: [],
    error: "",
    failOnce,
  });
  return readJob(session, id);
}
export function retryJob(session, id) {
  const current = readJob(session, id);
  if (current.status !== "failed")
    throw new ServiceError(409, "Only failed generations can be retried.");
  const job = session.jobs.get(id);
  Object.assign(job, {
    status: "queued",
    startedAt: Date.now(),
    attempt: job.attempt + 1,
    progress: 0,
    error: "",
  });
  return readJob(session, id);
}
export function readHistory(session, type) {
  return [...session.jobs.keys()]
    .map((id) => readJob(session, id))
    .filter((job) => job.type === type && job.status === "completed")
    .sort((a, b) => b.createdAt - a.createdAt);
}
