import * as config from "./generationConfig.js";
import { imagePromptCards, videoPromptCards } from "./promptPresets.js";
import { demoProfile } from "./server/demoProfile.js";
import { ServiceError } from "./server/serviceError.js";
import {
  saveSettings,
  resetSettings,
  readJob,
  submitJob,
  retryJob,
  readHistory,
} from "./generationService.js";
import { isValidStudioSettings } from "./generationValidation.js";

const prefix = "frame.demo.session.v1.";
const ttl = 8 * 60 * 60 * 1000;
const keyFor = (id) => prefix + id;
function storage() {
  try {
    return window.localStorage;
  } catch {
    throw new ServiceError(
      503,
      "Browser storage is unavailable. Allow site data and try again.",
    );
  }
}
function read(id) {
  const raw = storage().getItem(keyFor(id));
  if (!raw)
    throw new ServiceError(
      410,
      "Your demo session expired. Start a new session.",
    );
  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    throw new ServiceError(
      503,
      "This demo session could not be read. Start a new session.",
    );
  }
  if (
    session?.id !== id ||
    !Array.isArray(session.jobs) ||
    !isValidStudioSettings(session.settings?.image, "image") ||
    !isValidStudioSettings(session.settings?.video, "video")
  )
    throw new ServiceError(
      503,
      "This demo session contains invalid data. Start a new session.",
    );
  if (!Number.isFinite(session.expiresAt) || session.expiresAt < Date.now())
    throw new ServiceError(
      410,
      "Your demo session expired. Start a new session.",
    );
  session.expiresAt = Date.now() + ttl;
  session.jobs = new Map(session.jobs.map((job) => [job.id, job]));
  return session;
}
function save(session) {
  try {
    storage().setItem(
      keyFor(session.id),
      JSON.stringify({ ...session, jobs: [...session.jobs.values()] }),
    );
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      503,
      "Demo data could not be saved. Check available browser storage and try again.",
    );
  }
}
function media(id) {
  const store = storage();
  for (const key of Object.keys(store).filter((key) =>
    key.startsWith(prefix),
  )) {
    let session;
    try {
      session = read(key.slice(prefix.length));
    } catch (error) {
      if ([410, 503].includes(error.status)) continue;
      throw error;
    }
    for (const job of session.jobs.values()) {
      if (job.status !== "completed") continue;
      const index = job.items.findIndex((item) => item.id === id);
      if (index < 0) continue;
      return {
        item: job.items[index],
        navigation: {
          previous: job.items[index - 1]?.id || null,
          next: job.items[index + 1]?.id || null,
          index: index + 1,
          total: job.items.length,
        },
      };
    }
  }
  throw new ServiceError(
    404,
    "This preview is no longer available in this browser. Return to the studio to generate new media.",
  );
}
export function demoRequest(
  path,
  { sessionId, method = "GET", body, signal } = {},
) {
  signal?.throwIfAborted();
  try {
    const url = new URL(path, window.location.origin);
    const parts = url.pathname.split("/").filter(Boolean);
    const resource = parts[1];
    if (resource === "config")
      return Response.json({
        ...config,
        promptCards: { image: imagePromptCards, video: videoPromptCards },
        pollingInterval: 300,
      });
    if (resource === "profile") return Response.json({ profile: demoProfile });
    if (resource === "media")
      return Response.json(media(decodeURIComponent(parts[2])));
    if (resource === "sessions" && method === "POST") {
      const store = storage();
      for (const key of Object.keys(store).filter((key) =>
        key.startsWith(prefix),
      )) {
        try {
          const value = JSON.parse(store.getItem(key));
          if (value?.expiresAt < Date.now()) store.removeItem(key);
        } catch {
          /* Preserve unreadable records; a new session gets a separate key. */
        }
      }
      const settings = () => ({
        options: { ...config.defaultOptions },
        advanced: { ...config.defaultAdvanced },
      });
      const session = {
        id: crypto.randomUUID(),
        expiresAt: Date.now() + ttl,
        settings: { image: settings(), video: settings() },
        jobs: new Map(),
      };
      save(session);
      return Response.json(
        { id: session.id, expiresAt: session.expiresAt },
        { status: 201 },
      );
    }
    if (!sessionId)
      throw new ServiceError(401, "Start a studio session before continuing.");
    const session = read(sessionId);
    let result;
    if (resource === "settings") {
      const type = url.searchParams.get("type");
      if (!["image", "video"].includes(type))
        throw new ServiceError(400, "Choose an image or video studio.");
      result = {
        settings:
          method === "PUT"
            ? saveSettings(session, type, body)
            : method === "DELETE"
              ? resetSettings(session, type)
              : session.settings[type],
      };
    } else if (resource === "generate" && method === "POST")
      result = { job: submitJob(session, body) };
    else if (resource === "jobs")
      result = {
        job:
          parts[3] === "retry" && method === "POST"
            ? retryJob(session, parts[2])
            : readJob(session, parts[2]),
      };
    else if (resource === "history") {
      if (parts[2]) {
        const group = readJob(session, parts[2]);
        if (group.status !== "completed")
          throw new ServiceError(409, "This generation is not ready yet.");
        result = { group };
      } else {
        const type = url.searchParams.get("type");
        if (!["image", "video"].includes(type))
          throw new ServiceError(400, "Choose an image or video studio.");
        result = { history: readHistory(session, type) };
      }
    } else throw new ServiceError(404, "This demo action is unavailable.");
    save(session);
    return Response.json(result);
  } catch (error) {
    if (!(error instanceof ServiceError))
      console.error("Browser demo error", error);
    return Response.json(
      {
        error:
          error instanceof ServiceError
            ? error.message
            : "The demo could not complete this action. Please try again.",
      },
      { status: error instanceof ServiceError ? error.status : 500 },
    );
  }
}
