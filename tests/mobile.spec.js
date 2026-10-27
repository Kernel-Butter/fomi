import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 767, height: 1024 },
]) {
  test(`mobile ${viewport.width}px uses Generate and History drawers without page overflow`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/imagestudio");
    const studio = page.locator("#image-studio");
    const create = studio.getByRole("button", {
      name: "Create image",
      exact: true,
    });
    await expect(create).toBeVisible();
    await expect(
      studio.getByRole("button", { name: "Show history", exact: true }),
    ).toHaveCount(0);
    await expect(
      studio.getByLabel("Your prompt", { exact: true }),
    ).not.toBeVisible();
    await create.click();
    const drawer = page.getByRole("dialog", {
      name: "Create image",
      exact: true,
    });
    await expect(drawer).toBeVisible();
    let bounds = await drawer.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
    await drawer
      .getByLabel("Your prompt", { exact: true })
      .fill("A mobile mountain landscape");
    await drawer
      .getByRole("button", { name: "Advanced settings", exact: true })
      .click();
    const settings = page.getByRole("dialog", {
      name: "Advanced settings",
      exact: true,
    });
    await expect(settings).toBeVisible();
    bounds = await settings.boundingBox();
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    await settings.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(drawer).not.toBeVisible();
    await expect(
      studio.getByRole("status", { name: "Generation updates" }),
    ).toContainText("ready");
    const handle = studio.getByRole("button", {
      name: "Show history",
      exact: true,
    });
    await expect(handle).toBeVisible();
    bounds = await handle.boundingBox();
    expect(bounds.x + bounds.width).toBe(viewport.width);
    await handle.click();
    const history = page.getByRole("dialog", {
      name: "Image history",
      exact: true,
    });
    await expect(history).toBeVisible();
    await expect(
      history.getByRole("button", {
        name: "Open conversation: A mobile mountain landscape",
        exact: true,
      }),
    ).toHaveCount(1);
    await history
      .getByRole("button", {
        name: "Open conversation: A mobile mountain landscape",
        exact: true,
      })
      .click();
    await expect(history).not.toBeVisible();
    await expect(studio.locator(".generation-group")).toHaveCount(1);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  });
}

test("mobile drafts survive closing, resizing, and video navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/imagestudio");
  const studio = page.locator("#image-studio");
  await studio
    .getByRole("button", { name: "Use prompt: Edge of Wonder", exact: true })
    .click();
  const drawer = page.getByRole("dialog", {
    name: "Create image",
    exact: true,
  });
  await expect(drawer).toBeVisible();
  const prompt = studio.getByLabel("Your prompt", { exact: true });
  await prompt.fill("Keep my mobile draft");
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await page.setViewportSize({ width: 820, height: 1180 });
  await studio
    .getByRole("button", { name: "Create image", exact: true })
    .click();
  await expect(prompt).toHaveValue("Keep my mobile draft");
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(prompt).toBeVisible();
  await expect(prompt).toHaveValue("Keep my mobile draft");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Video Studio", exact: true })
    .click();
  const video = page.locator("#video-studio");
  await video
    .getByRole("button", { name: "Create video", exact: true })
    .click();
  const videoDrawer = page.getByRole("dialog", {
    name: "Create video",
    exact: true,
  });
  await videoDrawer
    .getByLabel("Your prompt", { exact: true })
    .fill("A mobile video");
  await videoDrawer
    .getByRole("button", { name: "Generate", exact: true })
    .click();
  await expect(
    video.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  await video
    .getByRole("link", { name: "Open video preview", exact: true })
    .first()
    .click({ position: { x: 10, y: 10 } });
  await expect(
    page.getByRole("dialog", { name: "Video preview", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await expect(
    video.getByRole("button", { name: "Create video", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Image Studio", exact: true })
    .click();
  await studio
    .getByRole("button", { name: "Create image", exact: true })
    .click();
  await expect(prompt).toHaveValue("Keep my mobile draft");
});
