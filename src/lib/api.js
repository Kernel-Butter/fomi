export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
import { validResponse } from "./responseValidation";
async function request(path, { sessionId, signal, method = "GET", body } = {}) {
  const timeout = AbortSignal.timeout(30000);
  try {
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const response =
      process.env.NEXT_PUBLIC_DEMO_STORAGE === "browser" &&
      typeof window !== "undefined"
        ? (await import("./browserDemo")).demoRequest(path, {
            sessionId,
            method,
            body,
            signal: requestSignal,
          })
        : await fetch(path, {
            method,
            signal: requestSignal,
            cache: "no-store",
            headers: {
              ...(sessionId ? { "X-Session-ID": sessionId } : {}),
              ...(body !== undefined
                ? { "Content-Type": "application/json" }
                : {}),
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
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new ApiError(
        "The server returned an unexpected response. Please try again.",
        response.status,
      );
    if (!response.ok) {
      if ([401, 410].includes(response.status) && typeof window !== "undefined")
        window.dispatchEvent(new Event("studio-session-expired"));
      throw new ApiError(
        typeof data.error === "string"
          ? data.error
          : "The request failed. Please try again.",
        response.status,
      );
    }
    if (!validResponse(path, data))
      throw new ApiError(
        "The server returned incomplete or invalid data. Please try again.",
        response.status,
      );
    return data;
  } catch (error) {
    if (signal?.aborted) throw signal.reason;
    if (timeout.aborted)
      throw new ApiError("The request took too long. Please try again.", 408);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Could not connect to the server. Check your connection and try again.",
      0,
    );
  }
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
      reject(
        signal.reason ?? new DOMException("Request cancelled", "AbortError"),
      );
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(
        signal.reason ?? new DOMException("Request cancelled", "AbortError"),
      );
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

export const getProfile = (signal) => request("/api/profile", { signal });
