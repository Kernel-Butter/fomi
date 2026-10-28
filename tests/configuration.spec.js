import { chooseOption, selectedControl } from "./helpers/select";
import { test, expect } from "@playwright/test";

test("API exposes structured models, validation limits, reference URLs, profile, and support data", async ({
  request,
}) => {
  const config = await (await request.get("/api/config")).json();
  expect(config.limits.prompt.maxLength).toBe(5000);
  expect(config.models.find((model) => model.id === "Flux").types).toEqual([
    "image",
  ]);
  expect(config.models.find((model) => model.id === "Studio").counts).toEqual([
    1, 2,
  ]);
  expect(
    config.references.Styles.every(
      (reference) => typeof reference.imageUrl === "string",
    ),
  ).toBe(true);
  expect(config.application.support.href).toMatch(/^mailto:/);
  expect(config.features.image).toBe(true);
  const profile = await (await request.get("/api/profile")).json();
  expect(profile.profile.displayName).toBeTruthy();
  expect(profile.profile.avatarUrl).toMatch(/^\/images\//);

  const session = await (await request.post("/api/sessions")).json();
  const headers = { "X-Session-ID": session.id };
  const base = {
    prompt: "A valid scene",
    count: 4,
    ratio: "3:4",
    model: "Frame 1.0",
    type: "image",
    advanced: config.defaultAdvanced,
  };
  for (const data of [
    { ...base, prompt: "a".repeat(config.limits.prompt.maxLength + 1) },
    {
      ...base,
      advanced: {
        ...base.advanced,
        negative: "a".repeat(config.limits.negative.maxLength + 1),
      },
    },
    { ...base, model: "Studio" },
    { ...base, model: "Flux", type: "video" },
    {
      ...base,
      model: "Flux",
      advanced: { ...base.advanced, camera: "Low Angle" },
    },
    { ...base, model: "Flux", advanced: { ...base.advanced, guidance: 16 } },
    { ...base, advanced: { ...base.advanced, guidance: 7.25 } },
  ])
    expect(
      (await request.post("/api/generate", { headers, data })).status(),
    ).toBe(400);
  const invalidSettings = {
    options: { model: "Studio", count: 4, ratio: "3:4" },
    advanced: config.defaultAdvanced,
  };
  expect(
    (
      await request.put("/api/settings?type=image", {
        headers,
        data: invalidSettings,
      })
    ).status(),
  ).toBe(400);
});

test("changing models normalizes unsupported selections and filters controls by studio", async ({
  page,
}) => {
  await page.goto("/imagestudio");
  const image = page.locator("#image-studio");
  await image
    .getByRole("button", { name: "Advanced settings", exact: true })
    .click();
  let modal = page.getByRole("dialog");
  await chooseOption(
    modal.getByRole("combobox", { name: /Sampling steps/ }),
    "50 steps",
  );
  await modal.getByRole("slider").focus();
  await modal.getByRole("slider").press("End");
  await modal
    .getByRole("button", { name: "Apply settings", exact: true })
    .click();
  await expect(modal).not.toBeVisible();
  await chooseOption(image.getByRole("combobox", { name: "Model" }), "Studio");
  await expect(selectedControl(image, "Number of images")).toContainText(
    "# 2 Images",
  );
  await expect(selectedControl(image, "Aspect ratio")).toContainText("16:9");
  await image
    .getByRole("button", { name: "Advanced settings", exact: true })
    .click();
  modal = page.getByRole("dialog");
  await expect(modal.getByRole("slider")).toHaveValue("12");
  await modal.getByRole("combobox", { name: /Sampling steps/ }).click();
  await expect(
    page.getByRole("option", { name: "50 steps", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();
  await chooseOption(image.getByRole("combobox", { name: "Model" }), "Flux");
  await image
    .getByRole("button", { name: "Advanced settings", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /Camera/, exact: false }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Video Studio", exact: true })
    .click();
  await page
    .locator("#video-studio")
    .getByRole("combobox", { name: "Model", exact: true })
    .click();
  await expect(
    page.getByRole("option", { name: "Flux", exact: true }),
  ).toHaveCount(0);
});

test("frontend reads limits, support, profile, and feature availability from API responses", async ({
  page,
}) => {
  await page.route("**/api/config", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.limits.prompt.maxLength = 12;
    data.limits.negative.maxLength = 17;
    data.limits.seed.max = 99;
    data.models[0].guidance.max = 15;
    data.application.support = {
      href: "mailto:help@demo.test",
      label: "Contact demo support",
    };
    data.features.video = false;
    data.references.Styles[0].imageUrl = "/images/sample-16.jpg";
    await route.fulfill({ json: data });
  });
  await page.route("**/api/profile", (route) =>
    route.fulfill({
      json: {
        profile: {
          displayName: "Demo Artist",
          avatarAlt: "Demo Artist avatar",
          avatarUrl: "/images/sample-2.jpg",
        },
      },
    }),
  );
  await page.goto("/imagestudio");
  const image = page.locator("#image-studio");
  await expect(
    image.getByLabel("Your prompt", { exact: true }),
  ).toHaveAttribute("maxlength", "12");
  await expect(
    page.getByRole("link", { name: "Contact demo support", exact: true }),
  ).toHaveAttribute("href", "mailto:help@demo.test");
  await expect(
    page.getByRole("img", { name: "Demo Artist avatar", exact: true }),
  ).toBeVisible();
  await expect(
    image.getByRole("link", { name: "Video", exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
  await image
    .getByRole("button", { name: "Advanced settings", exact: true })
    .click();
  const modal = page.getByRole("dialog");
  await expect(modal.getByLabel("Seed", { exact: false })).toHaveAttribute(
    "max",
    "99",
  );
  await expect(
    modal.getByLabel("Negative prompt", { exact: false }),
  ).toHaveAttribute("maxlength", "17");
  await expect(modal.getByRole("slider")).toHaveAttribute("max", "15");
  await expect(
    modal.getByRole("button", { name: /Natural/ }).getByRole("img"),
  ).toHaveAttribute("src", /sample-16/);
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "Video Studio", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "This studio is currently unavailable" }),
  ).toBeVisible();
});

test("optional profile failures do not block the studio", async ({ page }) => {
  await page.route("**/api/profile", (route) =>
    route.fulfill({ status: 503, json: { error: "Profile unavailable." } }),
  );
  await page.goto("/imagestudio");
  await expect(
    page.locator("#image-studio").getByLabel("Your prompt", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Profile", exact: true }),
  ).toBeVisible();
});
