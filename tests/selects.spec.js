import { test, expect } from "@playwright/test";
import { selectedControl } from "./helpers/select";

for (const width of [320, 820, 1024]) {
  test(`dropdown value and options share typography at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/imagestudio");
    const studio = page.locator("#image-studio");
    if (width < 1024)
      await studio
        .getByRole("button", { name: "Create image", exact: true })
        .click();
    const control = selectedControl(studio, "Number of images");
    const combo = studio.getByRole("combobox", {
      name: "Number of images",
      exact: true,
    });
    await combo.click();
    const option = page.getByRole("option", { name: "# 1 Image", exact: true });
    await expect(option).toBeVisible();
    const font = (element) => {
      const style = getComputedStyle(element);
      return { size: style.fontSize, family: style.fontFamily };
    };
    expect(await option.evaluate(font)).toEqual(await control.evaluate(font));
    await combo.press("ArrowUp");
    await combo.press("Enter");
    await expect(control).toContainText("# 3 Images");
  });
}
