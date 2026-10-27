import { test, expect } from "@playwright/test";

async function createSession(request) {
  const response = await request.post("/api/sessions");
  expect(response.status()).toBe(201);
  return { "X-Session-ID": (await response.json()).id };
}
async function complete(request, headers, id) {
  let job;
  await expect
    .poll(
      async () => {
        const response = await request.get(`/api/jobs/${id}`, { headers });
        expect(response.status()).toBe(200);
        ({ job } = await response.json());
        return ["completed", "failed"].includes(job.status);
      },
      { timeout: 10000, intervals: [150, 250] },
    )
    .toBe(true);
  return job;
}
const base = {
  prompt: "A lake under soft morning light",
  count: 2,
  ratio: "3:4",
  model: "Frame 1.0",
  type: "image",
};

test("configuration and settings are API-backed and isolated by session and studio", async ({
  request,
}) => {
  const config = await (await request.get("/api/config")).json();
  expect(config.promptCards.image).toHaveLength(4);
  expect(config.promptCards.video[0].prompt).not.toBe(
    config.promptCards.image[0].prompt,
  );
  const first = await createSession(request);
  const second = await createSession(request);
  const data = {
    options: { count: 2, ratio: "16:9", model: "Flux" },
    advanced: { ...config.defaultAdvanced, style: "Cinematic", seed: "123" },
  };
  expect(
    (
      await request.put("/api/settings?type=image", { headers: first, data })
    ).status(),
  ).toBe(200);
  const saved = await (
    await request.get("/api/settings?type=image", { headers: first })
  ).json();
  expect(saved.settings).toEqual(data);
  const separateStudio = await (
    await request.get("/api/settings?type=video", { headers: first })
  ).json();
  const separateSession = await (
    await request.get("/api/settings?type=image", { headers: second })
  ).json();
  expect(separateStudio.settings.advanced.seed).toBe("");
  expect(separateSession.settings.options.model).toBe("Frame 1.0");
  const reset = await (
    await request.delete("/api/settings?type=image", { headers: first })
  ).json();
  expect(reset.settings.advanced).toEqual(config.defaultAdvanced);
  expect(reset.settings.options).toEqual(data.options);
});

test("jobs progress, repeat deterministically, and expose grouped session history", async ({
  request,
}) => {
  const headers = await createSession(request);
  const config = await (await request.get("/api/config")).json();
  const payload = {
    ...base,
    advanced: { ...config.defaultAdvanced, seed: "42" },
  };
  const first = await request.post("/api/generate", { headers, data: payload });
  expect(first.status()).toBe(202);
  const { job: queued } = await first.json();
  expect(queued.status).toBe("queued");
  const activeHistory = await (
    await request.get("/api/history?type=image", { headers })
  ).json();
  expect(activeHistory.history).toHaveLength(0);
  await expect
    .poll(
      async () =>
        (
          await (
            await request.get(`/api/jobs/${queued.id}`, { headers })
          ).json()
        ).job.status,
      { intervals: [100], timeout: 1000 },
    )
    .toBe("processing");
  const finished = await complete(request, headers, queued.id);
  expect(finished.progress).toBe(100);
  expect(finished.items).toHaveLength(2);
  expect(finished.advanced.seed).toBe("42");
  const duplicate = await (
    await request.post("/api/generate", {
      headers,
      data: { ...payload, requestId: queued.id },
    })
  ).json();
  expect(duplicate.job.id).toBe(queued.id);
  const next = await (
    await request.post("/api/generate", { headers, data: payload })
  ).json();
  const repeated = await complete(request, headers, next.job.id);
  expect(repeated.items.map((item) => [item.src, item.presentation])).toEqual(
    finished.items.map((item) => [item.src, item.presentation]),
  );
  const changed = await (
    await request.post("/api/generate", {
      headers,
      data: {
        ...payload,
        advanced: {
          ...payload.advanced,
          color: "Golden Hour",
          camera: "Low Angle",
          negative: "unwanted text",
        },
      },
    })
  ).json();
  const styled = await complete(request, headers, changed.job.id);
  expect(styled.items[0].presentation.filter).toContain("sepia");
  expect(styled.items[0].presentation.objectPosition).toBe("50% 85%");
  const history = await (
    await request.get("/api/history?type=image", { headers })
  ).json();
  expect(history.history).toHaveLength(3);
  const conversation = await (
    await request.get(`/api/history/${queued.id}`, { headers })
  ).json();
  expect(conversation.group.items).toHaveLength(2);
  const videos = await (
    await request.get("/api/history?type=video", { headers })
  ).json();
  expect(videos.history).toHaveLength(0);
  const otherSession = await createSession(request);
  expect(
    (
      await request.get(`/api/history/${queued.id}`, { headers: otherSession })
    ).status(),
  ).toBe(404);
});

test("failed jobs can be retried without creating a duplicate conversation", async ({
  request,
}) => {
  const headers = await createSession(request);
  const response = await request.post("/api/generate", {
    headers: { ...headers, "X-Mock-Failure": "once" },
    data: base,
  });
  const { job } = await response.json();
  const failed = await complete(request, headers, job.id);
  expect(failed.status).toBe("failed");
  const retried = await request.post(`/api/jobs/${job.id}/retry`, { headers });
  expect(retried.status()).toBe(202);
  const finished = await complete(request, headers, job.id);
  expect(finished.status).toBe("completed");
  expect(finished.attempt).toBe(2);
  const history = await (
    await request.get("/api/history?type=image", { headers })
  ).json();
  expect(history.history).toHaveLength(1);
});

test("session, type, settings and ownership errors return actionable status codes", async ({
  request,
}) => {
  expect((await request.post("/api/generate", { data: base })).status()).toBe(
    401,
  );
  expect(
    (
      await request.get("/api/history?type=image", {
        headers: { "X-Session-ID": "expired" },
      })
    ).status(),
  ).toBe(410);
  const headers = await createSession(request);
  expect(
    (await request.get("/api/settings?type=invalid", { headers })).status(),
  ).toBe(400);
  expect(
    (
      await request.put("/api/settings?type=image", { headers, data: null })
    ).status(),
  ).toBe(400);
  expect((await request.get("/api/jobs/missing", { headers })).status()).toBe(
    404,
  );
});
