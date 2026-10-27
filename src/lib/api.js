export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
async function request(path, { sessionId, signal, method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    signal,
    cache: "no-store",
    headers: {
      ...(sessionId ? { "X-Session-ID": sessionId } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "The server returned an unexpected response. Please try again.",
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      data.error || "The request failed. Please try again.",
      response.status,
    );
  return data;
}
export const getConfig = (signal) => request("/api/config", { signal });
export const startSession = (signal) =>
  request("/api/sessions", { method: "POST", signal });
export const getSettings = (sessionId, type, signal) =>
  request(`/api/settings?type=${type}`, { sessionId, signal });
export const saveSettings = (sessionId, type, settings, signal) =>
  request(`/api/settings?type=${type}`, {
    sessionId,
    signal,
    method: "PUT",
    body: settings,
  });
export const resetSettings = (sessionId, type, signal) =>
  request(`/api/settings?type=${type}`, {
    sessionId,
    signal,
    method: "DELETE",
  });
export const submitGeneration = (sessionId, payload, signal) =>
  request("/api/generate", {
    sessionId,
    signal,
    method: "POST",
    body: payload,
  });
export const getJob = (sessionId, id, signal) =>
  request(`/api/jobs/${id}`, { sessionId, signal });
export const retryJob = (sessionId, id, signal) =>
  request(`/api/jobs/${id}/retry`, { sessionId, signal, method: "POST" });
export const getHistory = (sessionId, type, signal) =>
  request(`/api/history?type=${type}`, { sessionId, signal });
export const getConversation = (sessionId, id, signal) =>
  request(`/api/history/${id}`, { sessionId, signal });
export function pollDelay(duration, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Request cancelled", "AbortError"));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Request cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, duration);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export const getMedia = (id, signal) =>
  request(`/api/media/${encodeURIComponent(id)}`, { signal });
