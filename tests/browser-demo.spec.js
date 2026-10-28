import { test, expect } from "@playwright/test";

test.skip(
  !process.env.TEST_BROWSER_DEMO,
  "Run against a DEMO_STORAGE=browser build.",
);

test.beforeEach(async ({ page }) => {
  // A Vercel instance may have no session file at all. Browser mode must not
  // depend on any API route, including session creation or preview metadata.
  await page.route("**/api/**", (route) => route.abort());
});

test("demo settings, generation, history, and refreshed previews work without API routes", async ({
  page,
}) => {
  await page.goto("/imagestudio");
  const studio = page.locator("#image-studio");
  const prompt = studio.getByLabel("Your prompt", { exact: true });
  await prompt.fill("A landscape without a server session");
  await studio
    .getByRole("combobox", { name: "Aspect ratio", exact: true })
    .click();
  await page.getByRole("option", { name: "16:9", exact: true }).click();
  await studio.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(
    studio.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  await expect(studio.locator(".result-card")).toHaveCount(4);
  await expect(page.locator(".session-error")).toHaveCount(0);
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await expect(studio.locator(".history-deck")).toHaveCount(1);
  await studio
    .getByRole("button", {
      name: "Open image 1 of 4: A landscape without a server session",
      exact: true,
    })
    .click();
  await studio
    .getByRole("link", { name: "Open image preview", exact: true })
    .first()
    .click();
  const modal = page.getByRole("dialog", {
    name: "Image preview",
    exact: true,
  });
  await expect(
    modal.getByRole("status", { name: "Preview position" }),
  ).toHaveText("1 of 4");
  await modal.getByRole("button", { name: "Next image", exact: true }).click();
  await expect(
    modal.getByRole("status", { name: "Preview position" }),
  ).toHaveText("2 of 4");
  await page.reload();
  await expect(
    page
      .locator(".media-preview-page")
      .getByRole("status", { name: "Preview position" }),
  ).toHaveText("2 of 4");
  await expect(page.locator(".session-error")).toHaveCount(0);
  const stored = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith("frame.demo.session.v1."))
      .map((key) => JSON.parse(localStorage.getItem(key))),
  );
  expect(
    stored.some((session) =>
      session.jobs.some((job) => job.status === "completed"),
    ),
  ).toBe(true);
});

test("video generation and playback do not need a server session", async ({
  page,
}) => {
  await page.goto("/videostudio");
  const studio = page.locator("#video-studio");
  await studio
    .getByLabel("Your prompt", { exact: true })
    .fill("A browser-stored video");
  await studio.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(
    studio.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  const play = studio
    .getByRole("button", { name: "Play video", exact: true })
    .first();
  await play.focus();
  await play.press("Enter");
  await expect
    .poll(() =>
      studio
        .locator("video")
        .first()
        .evaluate((video) => !video.paused),
    )
    .toBe(true);
  await expect(page.locator(".session-error")).toHaveCount(0);
});

test("unavailable browser storage shows a recoverable message", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage is full", "QuotaExceededError");
    };
  });
  await page.goto("/imagestudio");
  await expect(
    page.getByRole("alert", { name: "Studio connection error" }),
  ).toContainText("browser storage");
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
});
