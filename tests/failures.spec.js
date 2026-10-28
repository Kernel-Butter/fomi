import { chooseOption, selectedControl } from "./helpers/select";
import { test, expect } from "@playwright/test";
const image = (page) => page.locator("#image-studio");

test("failed inline videos can be retried", async ({ page }) => {
  await page.goto("/videostudio");
  const current = page.locator("#video-studio");
  await current
    .getByLabel("Your prompt", { exact: true })
    .fill("Recover a failed video");
  await current.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(
    current.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  await page.route("**/videos/*.mp4", (route) => route.abort());
  const card = current.locator(".result-card").first();
  await card.getByRole("button", { name: "Play video", exact: true }).focus();
  await card
    .getByRole("button", { name: "Play video", exact: true })
    .press("Enter");
  await expect(card.getByRole("alert")).toContainText("Video unavailable");
  await page.unroute("**/videos/*.mp4");
  await card.getByRole("button", { name: "Retry video", exact: true }).click();
  await card.getByRole("button", { name: "Play video", exact: true }).focus();
  await card
    .getByRole("button", { name: "Play video", exact: true })
    .press("Enter");
  await expect
    .poll(() => card.locator("video").evaluate((video) => !video.paused))
    .toBe(true);
  await expect(card.getByRole("alert")).toHaveCount(0);
});

test("slow requests time out and initialization can recover", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const timeout = AbortSignal.timeout.bind(AbortSignal);
    AbortSignal.timeout = (duration) =>
      timeout(duration === 30000 ? 1000 : duration);
  });
  let fail = true;
  await page.route("**/api/config", async (route) => {
    if (fail) {
      fail = false;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    await route.continue();
  });
  await page.goto("/imagestudio");
  await expect(
    page.getByRole("alert", { name: "Studio connection error" }),
  ).toContainText("took too long");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    image(page).getByLabel("Your prompt", { exact: true }),
  ).toBeVisible();
});

test("invalid generation data offers retry without duplicating the job", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/generate", async (route) => {
    const response = await route.fetch();
    if (fail) {
      fail = false;
      await route.fulfill({ json: { job: { id: "incomplete" } } });
    } else await route.fulfill({ response });
  });
  await page.goto("/imagestudio");
  const current = image(page);
  await current
    .getByLabel("Your prompt", { exact: true })
    .fill("Malformed job recovery");
  await current.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(current.getByRole("alert")).toContainText("invalid data");
  await current
    .getByRole("button", { name: "Retry generation", exact: true })
    .click();
  await expect(
    current.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  await expect(current.locator(".generation-group")).toHaveCount(1);
});

test("missing media shows recovery controls", async ({ page }) => {
  await page.goto("/media/missing-media");
  await expect(page.locator(".media-preview-error")).toContainText(
    "no longer available",
  );
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to Image Studio", exact: true })
    .click();
  await expect(
    image(page).getByLabel("Your prompt", { exact: true }),
  ).toBeVisible();
});

test("incomplete configuration is rejected before rendering controls", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/config", async (route) => {
    if (fail) {
      fail = false;
      await route.fulfill({ json: {} });
    } else await route.continue();
  });
  await page.goto("/imagestudio");
  await expect(
    page.getByRole("alert", { name: "Studio connection error" }),
  ).toContainText("invalid data");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    image(page).getByLabel("Your prompt", { exact: true }),
  ).toBeVisible();
});

test("expired sessions keep drafts and offer an explicit restart", async ({
  page,
}) => {
  await page.goto("/imagestudio");
  const current = image(page);
  await current
    .getByLabel("Your prompt", { exact: true })
    .fill("Keep this draft after expiry");
  await page.route("**/api/generate", (route) =>
    route.fulfill({
      status: 410,
      json: { error: "Your demo session expired." },
    }),
  );
  await current.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.locator(".session-error")).toContainText(
    "Copy any unsent prompt",
  );
  await expect(current.getByLabel("Your prompt", { exact: true })).toHaveValue(
    "Keep this draft after expiry",
  );
  await page
    .getByRole("button", { name: "Start new session", exact: true })
    .click();
  await expect(page.locator(".session-error")).toHaveCount(0);
  await expect(
    current.getByRole("button", { name: "Generate", exact: true }),
  ).toBeVisible();
});

test("stuck generation polling stops and can resume the same job", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const timeout = AbortSignal.timeout.bind(AbortSignal);
    AbortSignal.timeout = (duration) =>
      timeout(duration === 120000 ? 1500 : duration);
  });
  await page.route("**/api/jobs/*", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.job.status = "processing";
    data.job.loading = true;
    data.job.items = [];
    await route.fulfill({ json: data });
  });
  await page.goto("/imagestudio");
  const current = image(page);
  await current
    .getByLabel("Your prompt", { exact: true })
    .fill("A job that never finishes polling");
  await current.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(current.getByRole("alert")).toContainText(
    "taking longer than expected",
  );
  await expect(
    current.getByRole("button", { name: "Generate", exact: true }),
  ).toBeEnabled();
  await page.unroute("**/api/jobs/*");
  await current
    .getByRole("button", { name: "Retry generation", exact: true })
    .click();
  await expect(
    current.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  await expect(current.locator(".generation-group")).toHaveCount(1);
});

test("broken result thumbnails can be retried", async ({ page }) => {
  await page.goto("/imagestudio");
  const current = image(page);
  await page.route("**/_next/image?*", (route) => route.abort());
  await current
    .getByLabel("Your prompt", { exact: true })
    .fill("Retry a broken thumbnail");
  await current.getByRole("button", { name: "Generate", exact: true }).click();
  const card = current.locator(".result-card").first();
  await expect(card.getByRole("alert")).toContainText(
    "Preview image unavailable",
  );
  await page.unroute("**/_next/image?*");
  await card.getByRole("button", { name: "Retry image", exact: true }).click();
  await expect(card.getByRole("alert")).toHaveCount(0);
  await expect
    .poll(() =>
      card
        .locator("img")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
});

test("invalid server responses show a recoverable initialization error", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/config", async (route) => {
    if (fail) {
      fail = false;
      await route.fulfill({ status: 200, json: null });
    } else await route.continue();
  });
  await page.goto("/imagestudio");
  await expect(
    page.getByRole("alert", { name: "Studio connection error" }),
  ).toContainText("unexpected response");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    image(page).getByLabel("Your prompt", { exact: true }),
  ).toBeVisible();
});

test("offline requests show a clear error and recover", async ({ page }) => {
  let fail = true;
  await page.route("**/api/config", async (route) => {
    if (fail) {
      fail = false;
      await route.abort("internetdisconnected");
    } else await route.continue();
  });
  await page.goto("/imagestudio");
  await expect(
    page.getByRole("alert", { name: "Studio connection error" }),
  ).toContainText("Check your connection");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    image(page).getByLabel("Your prompt", { exact: true }),
  ).toBeVisible();
});

test("a failed conversation request retries that conversation", async ({
  page,
}) => {
  await page.goto("/imagestudio");
  const current = image(page);
  await current
    .getByLabel("Your prompt", { exact: true })
    .fill("History recovery");
  await current.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(
    current.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  let requests = 0;
  await page.route("**/api/history/*", async (route) => {
    requests++;
    if (requests === 1)
      await route.fulfill({
        status: 503,
        json: { error: "Conversation unavailable." },
      });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await current
    .getByRole("button", {
      name: "Open image 1 of 4: History recovery",
      exact: true,
    })
    .click();
  await expect(current.getByRole("alert")).toContainText(
    "Conversation unavailable",
  );
  await current
    .getByRole("button", { name: "Retry opening conversation", exact: true })
    .click();
  await expect(current.getByRole("alert")).toHaveCount(0);
  expect(requests).toBe(2);
});

test("a lost submission response can retry an already failed server job", async ({
  page,
}) => {
  let loseResponse = true;
  await page.route("**/api/generate", async (route) => {
    if (!loseResponse) return route.continue();
    loseResponse = false;
    const response = await route.fetch({
      headers: { ...route.request().headers(), "X-Mock-Failure": "once" },
    });
    const { job } = await response.json();
    await expect
      .poll(
        async () => {
          const response = await page.request.get(`/api/jobs/${job.id}`, {
            headers: route.request().headers(),
          });
          return (await response.json()).job.status;
        },
        { timeout: 10000 },
      )
      .toBe("failed");
    await route.abort("failed");
  });
  await page.goto("/imagestudio");
  const current = image(page);
  await current
    .getByLabel("Your prompt", { exact: true })
    .fill("Recover lost response");
  await current.getByRole("button", { name: "Generate", exact: true }).click();
  await current
    .getByRole("button", { name: "Retry generation", exact: true })
    .click();
  await expect(
    current.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  await expect(current.locator(".generation-group")).toHaveCount(1);
});

test("failed generation retries through the backend and preserves its prompt", async ({
  page,
}) => {
  await page.route("**/api/generate", (route) =>
    route.continue({
      headers: { ...route.request().headers(), "X-Mock-Failure": "once" },
    }),
  );
  await page.goto("/imagestudio");
  const current = image(page);
  await current
    .getByLabel("Your prompt", { exact: true })
    .fill("A retryable mountain portrait");
  await current.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(
    current.getByRole("button", { name: "Retry generation", exact: true }),
  ).toBeVisible();
  await current
    .getByRole("button", { name: "Retry generation", exact: true })
    .click();
  await expect(
    current.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  await expect(current.locator(".generation-group")).toHaveCount(1);
  await expect(current.getByLabel("Your prompt", { exact: true })).toHaveValue(
    "A retryable mountain portrait",
  );
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await expect(current.locator(".history-deck")).toHaveCount(1);
});

test("settings failures are recoverable without losing the prompt draft", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/settings?type=image", async (route) => {
    if (route.request().method() === "PUT" && fail) {
      fail = false;
      await route.fulfill({
        status: 503,
        json: { error: "Settings are temporarily unavailable." },
      });
    } else await route.continue();
  });
  await page.goto("/imagestudio");
  const current = image(page);
  await current
    .getByLabel("Your prompt", { exact: true })
    .fill("Keep my unsent draft");
  await chooseOption(
    current.getByRole("combobox", { name: "Aspect ratio" }),
    "16:9",
  );
  await expect(
    current.getByText("Settings are temporarily unavailable."),
  ).toBeVisible();
  await expect(current.getByLabel("Your prompt", { exact: true })).toHaveValue(
    "Keep my unsent draft",
  );
  await current
    .getByRole("button", { name: "Retry saving", exact: true })
    .click();
  await expect(selectedControl(current, "Aspect ratio")).toContainText("16:9");
  await expect(
    current.getByText("Settings are temporarily unavailable."),
  ).toHaveCount(0);
});

test("configuration connection failures offer a working initialization retry", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/config", async (route) => {
    if (fail) {
      fail = false;
      await route.fulfill({
        status: 503,
        json: { error: "The studio is temporarily unavailable." },
      });
    } else await route.continue();
  });
  await page.goto("/imagestudio");
  await expect(
    page.getByRole("alert", { name: "Studio connection error" }),
  ).toContainText("temporarily unavailable");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    image(page).getByLabel("Your prompt", { exact: true }),
  ).toBeVisible();
});
