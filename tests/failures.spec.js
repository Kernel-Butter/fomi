import { test, expect } from "@playwright/test";
const image = (page) => page.locator("#image-studio");

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
  await current
    .getByRole("combobox", { name: "Aspect ratio", exact: true })
    .selectOption("16:9");
  await expect(
    current.getByText("Settings are temporarily unavailable."),
  ).toBeVisible();
  await expect(current.getByLabel("Your prompt", { exact: true })).toHaveValue(
    "Keep my unsent draft",
  );
  await current
    .getByRole("button", { name: "Retry saving", exact: true })
    .click();
  await expect(
    current.getByRole("combobox", { name: "Aspect ratio", exact: true }),
  ).toHaveValue("16:9");
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
