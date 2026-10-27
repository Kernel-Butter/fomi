import { test, expect } from "@playwright/test";

async function generate(page, type = "image", count = 4) {
  await page.goto(`/${type}studio`);
  const studio = page.locator(`#${type}-studio`);
  if (count !== 4)
    await studio
      .getByRole("combobox", { name: "Number of images", exact: true })
      .selectOption(String(count));
  await studio
    .getByLabel("Your prompt", { exact: true })
    .fill(`A ${type} preview test`);
  await studio.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(
    studio.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  await expect(
    studio.getByRole("button", { name: "Generate", exact: true }),
  ).toBeEnabled();
  return studio;
}

test("image interception preserves the studio and supports close, Back, Forward, and Escape", async ({
  page,
}) => {
  const studio = await generate(page);
  const link = studio
    .getByRole("link", { name: "Open image preview", exact: true })
    .first();
  await link.click();
  await expect(page).toHaveURL(/\/media\//);
  const modal = page.getByRole("dialog", {
    name: "Image preview",
    exact: true,
  });
  await expect(modal).toBeVisible();
  await expect(studio).toBeVisible();
  await expect(modal.getByRole("img")).toHaveAttribute(
    "alt",
    "A image preview test",
  );
  await expect
    .poll(() =>
      modal
        .getByRole("img")
        .evaluate((image) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  const close = modal.getByRole("button", {
    name: "Close preview",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    modal.getByRole("button", { name: "Next image", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await close.click();
  await expect(page).toHaveURL(/\/imagestudio$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(studio.locator(".generation-group")).toHaveCount(1);
  await expect(link).toBeFocused();
  await link.click();
  await expect(modal).toBeVisible();
  await expect(page).toHaveURL(/\/media\//);
  await page.goBack();
  await expect(page).toHaveURL(/\/imagestudio$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goForward();
  await expect(modal).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/imagestudio$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("video preview has native controls and pauses playback behind the modal", async ({
  page,
}) => {
  const studio = await generate(page, "video");
  await studio
    .getByRole("link", { name: "Open video preview", exact: true })
    .first()
    .click({ position: { x: 10, y: 10 } });
  const modal = page.getByRole("dialog", {
    name: "Video preview",
    exact: true,
  });
  await expect(modal).toBeVisible();
  const video = modal.locator("video");
  await expect(video).toHaveAttribute("controls", "");
  await expect
    .poll(() => video.evaluate((element) => !element.paused))
    .toBe(true);
  expect(
    await studio
      .locator("video")
      .evaluateAll((videos) => videos.every((video) => video.paused)),
  ).toBe(true);
  await modal
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await expect(page).toHaveURL(/\/videostudio$/);
  await expect(studio.locator(".generation-group")).toHaveCount(1);
});

test("refresh renders a standalone preview and a new studio session remains empty", async ({
  page,
}) => {
  const studio = await generate(page);
  await studio
    .getByRole("link", { name: "Open image preview", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Image preview" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".media-preview-page")).toBeVisible();
  await expect(
    page.locator(".media-preview-page").getByRole("img"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to studio", exact: true }).click();
  await expect(page).toHaveURL(/\/imagestudio$/);
  await expect(page.locator("#image-studio .generation-group")).toHaveCount(0);
});

test("backdrop closes the modal and normal navigation clears an unavailable preview slot", async ({
  page,
}) => {
  const studio = await generate(page);
  const link = studio
    .getByRole("link", { name: "Open image preview", exact: true })
    .first();
  await link.click();
  await expect(
    page.getByRole("dialog", { name: "Image preview" }),
  ).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(page).toHaveURL(/\/imagestudio$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.route("**/api/media/**", (route) =>
    route.fulfill({
      status: 404,
      json: { error: "This preview is no longer available." },
    }),
  );
  await link.click();
  const modal = page.getByRole("dialog", { name: "Image preview" });
  await expect(modal.getByRole("alert")).toContainText("no longer available");
  await modal
    .getByRole("link", { name: "Back to Image Studio", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(studio.locator(".generation-group")).toHaveCount(1);
});

test("preview remains usable within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const studio = await generate(page);
  await studio
    .getByRole("link", { name: "Open image preview", exact: true })
    .first()
    .click();
  const modal = page.getByRole("dialog", { name: "Image preview" });
  await expect(modal).toBeVisible();
  const bounds = await modal.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await modal
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await expect(page).toHaveURL(/\/imagestudio$/);
});

test("preview arrows navigate the same generation and Close returns directly to the studio", async ({
  page,
}) => {
  const studio = await generate(page);
  await studio
    .getByRole("link", { name: "Open image preview", exact: true })
    .first()
    .click();
  const modal = page.getByRole("dialog", {
    name: "Image preview",
    exact: true,
  });
  const position = modal.getByRole("status", { name: "Preview position" });
  await expect(position).toHaveText("1 of 4");
  await expect(
    modal.getByRole("button", { name: "Previous image", exact: true }),
  ).toBeDisabled();
  const originalUrl = page.url();
  await modal.getByRole("button", { name: "Next image", exact: true }).click();
  await expect(position).toHaveText("2 of 4");
  expect(page.url()).not.toBe(originalUrl);
  await page.keyboard.press("ArrowRight");
  await expect(position).toHaveText("3 of 4");
  await page.keyboard.press("ArrowLeft");
  await expect(position).toHaveText("2 of 4");
  await modal
    .getByRole("button", { name: "Previous image", exact: true })
    .click();
  await expect(position).toHaveText("1 of 4");
  await modal
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await expect(page).toHaveURL(/\/imagestudio$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(studio.locator(".generation-group")).toHaveCount(1);
});

test("single-image previews omit navigation controls", async ({ page }) => {
  const studio = await generate(page, "image", 1);
  await studio
    .getByRole("link", { name: "Open image preview", exact: true })
    .click();
  const modal = page.getByRole("dialog", {
    name: "Image preview",
    exact: true,
  });
  await expect(modal.getByRole("img")).toBeVisible();
  await expect(
    modal.getByRole("group", { name: "Preview navigation" }),
  ).toHaveCount(0);
});

test("standalone previews change images without opening an intercepted modal", async ({
  page,
}) => {
  const studio = await generate(page);
  await studio
    .getByRole("link", { name: "Open image preview", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Image preview" }),
  ).toBeVisible();
  await page.reload();
  const preview = page.locator(".media-preview-page");
  await expect(
    preview.getByRole("status", { name: "Preview position" }),
  ).toHaveText("1 of 4");
  await preview
    .getByRole("button", { name: "Next image", exact: true })
    .click();
  await expect(
    preview.getByRole("status", { name: "Preview position" }),
  ).toHaveText("2 of 4");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
