import { test, expect } from "@playwright/test";

test("top progress line tracks a pending route and clears after navigation", async ({
  page,
}) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let intercepted = false;
  await page.route("**/media/**", async (route) => {
    if (route.request().headers().rsc === "1") {
      intercepted = true;
      await gate;
    }
    await route.continue();
  });
  try {
    await page.goto("/imagestudio");
    const studio = page.locator("#image-studio");
    await studio
      .getByLabel("Your prompt", { exact: true })
      .fill("A progress indicator test");
    await studio.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(
      studio.getByRole("status", { name: "Generation updates" }),
    ).toContainText("ready");
    await studio
      .getByRole("link", { name: "Open image preview", exact: true })
      .first()
      .click();
    await expect.poll(() => intercepted).toBe(true);
    const progress = page.locator(".route-progress.is-loading").first();
    await expect(progress).toHaveCSS("opacity", "1");
    await expect(progress).toHaveCSS("height", "3px");
    await expect(progress).toHaveCSS("position", "fixed");
    release();
    await expect(
      page.getByRole("dialog", { name: "Image preview", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".route-progress.is-loading")).toHaveCount(0);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close preview", exact: true })
      .click();
    await expect(page).toHaveURL(/\/imagestudio$/);
    await expect(page.locator(".route-progress.is-loading")).toHaveCount(0);
  } finally {
    release();
  }
});

test("same-route and disabled navigation do not leave a loading line active", async ({
  page,
}) => {
  await page.goto("/imagestudio");
  await expect(
    page.locator("#image-studio").getByLabel("Your prompt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Image Studio", exact: true })
    .click();
  await expect(page).toHaveURL(/\/imagestudio$/);
  await expect(page.locator(".route-progress.is-loading")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Contact support", exact: true }),
  ).toHaveAttribute("href", /^mailto:/);
});
