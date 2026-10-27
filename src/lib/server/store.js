import { randomUUID } from "node:crypto";
import { defaultAdvanced, defaultOptions } from "../generationConfig.js";

const STORE_KEY = Symbol.for("fomi.demo.sessions.v1");
const sessions = (globalThis[STORE_KEY] ||= new Map());
const TTL = 8 * 60 * 60 * 1000;

export class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function defaultSettings() {
  return {
    options: { ...defaultOptions },
    advanced: { ...defaultAdvanced },
  };
}
export function createSession() {
  const now = Date.now();
  for (const [id, session] of sessions)
    if (session.expiresAt < now) sessions.delete(id);
  if (sessions.size >= 200)
    throw new ServiceError(503, "The demo is busy. Please try again shortly.");
  const session = {
    id: randomUUID(),
    expiresAt: now + TTL,
    settings: { image: defaultSettings(), video: defaultSettings() },
    jobs: new Map(),
  };
  sessions.set(session.id, session);
  return { id: session.id, expiresAt: session.expiresAt };
}
export function getSession(request) {
  const id = request.headers.get("x-session-id");
  if (!id)
    throw new ServiceError(401, "Start a studio session before continuing.");
  const session = sessions.get(id);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(id);
    throw new ServiceError(
      410,
      "Your demo session expired. Refresh to start a new session.",
    );
  }
  session.expiresAt = Date.now() + TTL;
  return session;
}
export function getType(request) {
  const type = new URL(request.url).searchParams.get("type");
  if (!["image", "video"].includes(type))
    throw new ServiceError(400, "Choose an image or video studio.");
  return type;
}

export function findPublicMedia(id) {
  for (const session of sessions.values()) {
    if (session.expiresAt < Date.now()) continue;
    for (const job of session.jobs.values()) {
      if (job.status !== "completed") continue;
      const item = job.items.find((value) => value.id === id);
      if (item) {
        const index = job.items.findIndex((value) => value.id === id);
        return {
          item,
          navigation: {
            previous: job.items[index - 1]?.id || null,
            next: job.items[index + 1]?.id || null,
            index: index + 1,
            total: job.items.length,
          },
        };
      }
    }
  }
  return null;
}
