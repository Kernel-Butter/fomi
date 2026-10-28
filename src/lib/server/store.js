import { randomUUID } from "node:crypto";
import { defaultAdvanced, defaultOptions } from "../generationConfig.js";
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { ServiceError } from "./serviceError.js";
import { isValidStudioSettings } from "../generationValidation.js";
export { ServiceError } from "./serviceError.js";

const STORE_KEY = Symbol.for("fomi.demo.json-store.v1");
const state = (globalThis[STORE_KEY] ||= {
  sessions: new Map(),
  queue: Promise.resolve(),
});
const sessions = state.sessions;
const TTL = 8 * 60 * 60 * 1000;

export function getStorePath() {
  return process.env.DEMO_STORE_PATH
    ? resolve(process.env.DEMO_STORE_PATH)
    : process.env.VERCEL
      ? join(tmpdir(), "frame-studio", "demo-store.json")
      : join(process.cwd(), ".data", "demo-store.json");
}
async function loadStore(filePath) {
  let data;
  try {
    data = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      sessions.clear();
      return;
    }
    console.error("Demo JSON storage read failed:", error);
    throw new ServiceError(
      503,
      "Demo storage could not be read. Please try again later.",
    );
  }
  const valid =
    data?.version === 1 &&
    Array.isArray(data.sessions) &&
    data.sessions.every(
      (session) =>
        session &&
        typeof session.id === "string" &&
        Number.isFinite(session.expiresAt) &&
        isValidStudioSettings(session.settings?.image, "image") &&
        isValidStudioSettings(session.settings?.video, "video") &&
        Array.isArray(session.jobs) &&
        session.jobs.every(
          (job) =>
            job &&
            typeof job.id === "string" &&
            Array.isArray(job.items) &&
            Number.isFinite(job.startedAt) &&
            Number.isFinite(job.duration),
        ),
    );
  if (!valid)
    throw new ServiceError(
      503,
      "Demo storage contains invalid data. Please restore or reset the demo data file.",
    );
  sessions.clear();
  for (const session of data.sessions) {
    if (session.expiresAt >= Date.now())
      sessions.set(session.id, {
        ...session,
        jobs: new Map(session.jobs.map((job) => [job.id, job])),
      });
  }
}
async function saveStore(filePath) {
  const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await mkdir(dirname(filePath), { recursive: true });
    const data = {
      version: 1,
      sessions: [...sessions.values()].map((session) => ({
        ...session,
        jobs: [...session.jobs.values()],
      })),
    };
    await writeFile(temporary, JSON.stringify(data), {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporary, filePath);
  } catch (error) {
    console.error("Demo JSON storage write failed:", error);
    throw new ServiceError(
      503,
      "Demo storage could not be saved. Please try again.",
    );
  } finally {
    await unlink(temporary).catch(() => {});
  }
}
// One transaction at a time within this Node process. Other server instances
// have their own temporary files; this is deliberately a demo database.
export function withJsonStore(action, { filePath = getStorePath() } = {}) {
  const run = async () => {
    await loadStore(filePath);
    const result = await action();
    await saveStore(filePath);
    return result;
  };
  const result = state.queue.then(run, run);
  state.queue = result.catch(() => {});
  return result;
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
