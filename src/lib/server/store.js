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
