import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 820, height: 1180, columns: 2 },
  { width: 1180, height: 820, columns: 3 },
]) {
  test(`tablet ${viewport.width}px uses a Create drawer and ${viewport.columns} result columns`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/imagestudio");
    const studio = page.locator("#image-studio");
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    const navigation = page.getByRole("dialog", {
      name: "Navigation",
      exact: true,
    });
    await expect(navigation).toBeVisible();
    await expect(
      navigation.getByRole("link", { name: "Image Studio", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("Escape");
    await expect(navigation).not.toBeVisible();
    const create = studio.getByRole("button", {
      name: "Create image",
      exact: true,
    });
    await expect(create).toBeVisible();
    await expect(
      studio.getByLabel("Your prompt", { exact: true }),
    ).not.toBeVisible();
    await create.click();
    const drawer = page.getByRole("dialog", {
      name: "Create image",
      exact: true,
    });
    await expect(drawer).toBeVisible();
    const drawerBounds = await drawer.boundingBox();
    expect(drawerBounds.y).toBeGreaterThan(0);
    expect(drawerBounds.y + drawerBounds.height).toBeCloseTo(
      viewport.height,
      0,
    );
    await drawer
      .getByLabel("Your prompt", { exact: true })
      .fill("A wide tablet landscape");
    await drawer.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(drawer).not.toBeVisible();
    await expect(
      studio.getByRole("status", { name: "Generation updates" }),
    ).toContainText("ready");
    const columns = await studio
      .locator(".result-grid")
      .evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
      );
    expect(columns).toBe(viewport.columns);
    const results = await studio.locator(".results-scroll").boundingBox();
    expect(results.width).toBeGreaterThan(viewport.width - 100);
    await studio
      .getByRole("button", { name: "Show history", exact: true })
      .click();
    const history = page.getByRole("dialog", {
      name: "Image history",
      exact: true,
    });
    await expect(history).toBeVisible();
    const entry = history.getByRole("button", {
      name: "Open conversation: A wide tablet landscape",
      exact: true,
    });
    await expect(entry).toBeVisible();
    const layers = entry.locator(".compact-history-thumbnail > span");
    const before = await layers.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).transform),
    );
    await entry.hover();
    const after = await layers.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).transform),
    );
    expect(after).toEqual(before);
    await entry.click();
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

test("tablet prompt cards open the drawer and drafts survive closing and resizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
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
  await expect(prompt).toBeFocused();
  const draft = await prompt.inputValue();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(
    studio.getByRole("button", { name: "Create image", exact: true }),
  ).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(prompt).toBeVisible();
  await expect(prompt).toHaveValue(draft);
  await page.setViewportSize({ width: 820, height: 1180 });
  await studio
    .getByRole("button", { name: "Create image", exact: true })
    .click();
  await expect(prompt).toHaveValue(draft);
  await drawer
    .getByRole("button", { name: "Advanced settings", exact: true })
    .click();
  const advanced = page.getByRole("dialog", {
    name: "Advanced settings",
    exact: true,
  });
  await expect(advanced).toBeVisible();
  const columns = await advanced
    .locator(".reference-grid")
    .evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(" ").length,
    );
  expect(columns).toBe(2);
  await page.keyboard.press("Escape");
  await expect(advanced).not.toBeVisible();
  await expect(drawer).toBeVisible();
});
