import { test, expect } from "@playwright/test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import {
  createSession,
  getSession,
  withJsonStore,
} from "../src/lib/server/store.js";
import { readJob, saveSettings, submitJob } from "../src/lib/server/service.js";

let directory;
let filePath;
test.beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "frame-json-test-"));
  filePath = join(directory, "demo-store.json");
});
test.afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});
const requestFor = (id) =>
  new Request("http://localhost/api/settings?type=image", {
    headers: { "X-Session-ID": id },
  });

test("a separate Node process can create a session that this process restores", async () => {
  const moduleUrl = pathToFileURL(resolve("src/lib/server/store.js")).href;
  const script = `const {createSession, withJsonStore} = await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify(await withJsonStore(createSession, {filePath: ${JSON.stringify(filePath)}})));`;
  const session = JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      encoding: "utf8",
    }),
  );
  const restored = await withJsonStore(
    () => getSession(requestFor(session.id)),
    { filePath },
  );
  expect(restored.id).toBe(session.id);
  expect(restored.jobs).toBeInstanceOf(Map);
});

test("settings and generation jobs survive JSON round trips", async () => {
  const session = await withJsonStore(createSession, { filePath });
  let id;
  await withJsonStore(
    () => {
      const stored = getSession(requestFor(session.id));
      saveSettings(stored, "image", {
        ...stored.settings.image,
        options: { ...stored.settings.image.options, count: 1 },
      });
      id = submitJob(stored, {
        prompt: "A persisted landscape",
        count: 1,
        ratio: "3:4",
        model: "Frame 1.0",
        type: "image",
      }).id;
      stored.jobs.get(id).startedAt = Date.now() - 10000;
    },
    { filePath },
  );
  await withJsonStore(
    () => {
      const stored = getSession(requestFor(session.id));
      expect(stored.settings.image.options.count).toBe(1);
      expect(readJob(stored, id).status).toBe("completed");
    },
    { filePath },
  );
  const data = JSON.parse(await readFile(filePath, "utf8"));
  expect(data.version).toBe(1);
  expect(data.sessions[0].jobs[0].items).toHaveLength(1);
});

test("concurrent requests retain every session", async () => {
  const sessions = await Promise.all(
    Array.from({ length: 12 }, () =>
      withJsonStore(createSession, { filePath }),
    ),
  );
  const data = JSON.parse(await readFile(filePath, "utf8"));
  expect(data.sessions).toHaveLength(12);
  expect(new Set(data.sessions.map((value) => value.id))).toEqual(
    new Set(sessions.map((value) => value.id)),
  );
});

test("failed transactions do not persist partial changes and do not block the queue", async () => {
  const session = await withJsonStore(createSession, { filePath });
  await expect(
    withJsonStore(
      () => {
        getSession(requestFor(session.id)).settings.image.options.count = 1;
        throw new Error("Simulated action failure");
      },
      { filePath },
    ),
  ).rejects.toThrow("Simulated action failure");
  await withJsonStore(
    () =>
      expect(
        getSession(requestFor(session.id)).settings.image.options.count,
      ).toBe(4),
    { filePath },
  );
});

test("corrupt JSON is reported without overwriting the original file", async () => {
  await writeFile(filePath, "{broken");
  await expect(
    withJsonStore(createSession, { filePath }),
  ).rejects.toMatchObject({ status: 503 });
  expect(await readFile(filePath, "utf8")).toBe("{broken");
});
