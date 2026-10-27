import { test, expect } from "@playwright/test";

async function mockGeneration(page) {
  let generation = 0;
  await page.route("**/api/generate", async (route) => {
    const data = route.request().postDataJSON();
    const id = ++generation;
    await route.fulfill({
      json: {
        items: Array.from({ length: data.count }, (_, index) => ({
          id: `${id}-${index}`,
          type: data.type,
          prompt: data.prompt,
          model: data.model,
          src:
            data.type === "video"
              ? "/videos/sample-1.mp4"
              : "/images/sample-5.jpg",
          poster: "/images/sample-5.jpg",
          width: 768,
          height: 1024,
        })),
      },
    });
  });
}

function studio(page, type = "image") {
  return page.locator(`#${type}-studio`);
}
async function switchStudio(page, type) {
  const link = page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", {
      name: `${type === "image" ? "Image" : "Video"} Studio`,
      exact: true,
    });
  await link.focus();
  await link.press("Enter");
  await expect(studio(page, type)).toBeVisible();
}
async function generate(page, prompt, type = "image") {
  const current = studio(page, type);
  await current.getByLabel("Your prompt", { exact: true }).fill(prompt);
  await current.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(current.getByRole("status")).toContainText("ready");
}

test("invalid JSON bodies return 400 rather than a server error", async ({
  request,
}) => {
  for (const data of [null, [], "text", 17, {}, { prompt: " " }]) {
    const response = await request.post("/api/generate", {
      data: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(400);
  }
  const response = await request.post("/api/generate", {
    data: "{",
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status()).toBe(400);
});

test("drafts, settings and completed chats survive navigation but reset on refresh", async ({
  page,
}) => {
  await mockGeneration(page);
  await page.goto("/imagestudio");
  const image = studio(page);
  await expect(image.getByRole("button", { name: "Show history" })).toHaveCount(
    0,
  );
  await image
    .getByRole("combobox", { name: "Aspect ratio", exact: true })
    .selectOption("16:9");
  await generate(page, "A lasting image conversation");
  await image
    .getByLabel("Your prompt", { exact: true })
    .fill("Unsent image draft");
  await switchStudio(page, "video");
  await studio(page, "video")
    .getByLabel("Your prompt", { exact: true })
    .fill("Independent video draft");
  await switchStudio(page, "image");
  await expect(image.getByLabel("Your prompt", { exact: true })).toHaveValue(
    "Unsent image draft",
  );
  await expect(
    image.getByRole("combobox", { name: "Aspect ratio", exact: true }),
  ).toHaveValue("16:9");
  await expect(image.locator(".generation-group")).toHaveCount(1);
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("link", { name: "wand", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Back to Image Studio", exact: true })
    .click();
  await expect(image.getByLabel("Your prompt", { exact: true })).toHaveValue(
    "Unsent image draft",
  );
  await page.reload();
  await expect(image.getByLabel("Your prompt", { exact: true })).toHaveValue(
    "",
  );
  await expect(image.locator(".generation-group")).toHaveCount(0);
});

test("advanced settings share styles, discard cancelled edits, and save applied values", async ({
  page,
}) => {
  await page.goto("/imagestudio");
  const image = studio(page);
  const open = () =>
    image
      .getByRole("button", { name: "Advanced settings", exact: true })
      .click();
  const modal = page.getByRole("dialog");
  await open();
  await modal.getByRole("button", { name: /Dreamscape/ }).click();
  await modal.getByLabel("Seed", { exact: false }).fill("42");
  await modal.getByRole("button", { name: "Cancel", exact: true }).click();
  await open();
  await expect(modal.getByLabel("Seed", { exact: false })).toHaveValue("");
  await modal.getByRole("button", { name: /Dreamscape/ }).click();
  await modal.getByLabel("Seed", { exact: false }).fill("42");
  await modal.getByRole("button", { name: "Apply settings" }).click();
  await image.getByRole("button", { name: "Styles", exact: true }).click();
  await expect(
    image.getByRole("button", { name: "Dreamscape", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await switchStudio(page, "video");
  await switchStudio(page, "image");
  await open();
  await expect(modal.getByLabel("Seed", { exact: false })).toHaveValue("42");
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
  await expect(
    image.getByRole("button", { name: "Advanced settings", exact: true }),
  ).toBeFocused();
});

test("history is one entry per conversation and clicking it does not duplicate chats", async ({
  page,
}) => {
  await mockGeneration(page);
  await page.goto("/imagestudio");
  const image = studio(page);
  await generate(page, "First conversation");
  await generate(page, "Second conversation");
  for (let index = 3; index <= 5; index++)
    await generate(page, "Conversation " + index);
  await page.getByRole("button", { name: "Gallery", exact: true }).click();
  await expect(image.locator(".history-deck")).toHaveCount(5);
  await expect(
    image.locator(".history-deck").first().getByRole("button"),
  ).toHaveCount(4);
  await image
    .getByRole("button", {
      name: "Open image 1 of 4: First conversation",
      exact: true,
    })
    .click();
  await expect(image.locator(".generation-group")).toHaveCount(5);
  await expect(image.locator(".generation-group").first()).toBeInViewport();
  await expect
    .poll(() =>
      image.locator(".results-scroll").evaluate((element) => element.scrollTop),
    )
    .toBeLessThan(8);
});

test("video pauses when leaving its retained studio", async ({ page }) => {
  await mockGeneration(page);
  await page.goto("/videostudio");
  const videoStudio = studio(page, "video");
  await generate(page, "A moving landscape", "video");
  const playButton = videoStudio
    .getByRole("button", { name: "Play video", exact: true })
    .first();
  await playButton.focus();
  await playButton.press("Enter");
  const video = videoStudio.locator("video").first();
  await expect
    .poll(() => video.evaluate((element) => element.paused))
    .toBe(false);
  await switchStudio(page, "image");
  await expect
    .poll(() => video.evaluate((element) => element.paused))
    .toBe(true);
  await switchStudio(page, "video");
  await expect
    .poll(() => video.evaluate((element) => element.paused))
    .toBe(true);
});

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 820, height: 1180 },
  { width: 390, height: 844 },
]) {
  test(`studio and modal stay within the ${viewport.width}px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/imagestudio");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= window.innerWidth &&
          document.documentElement.scrollHeight <= window.innerHeight,
      ),
    ).toBe(true);
    await studio(page)
      .getByRole("button", { name: "Advanced settings", exact: true })
      .click();
    const box = await page.getByRole("dialog").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  });
}

test("advanced values are validated and supported style options are consistent", async ({
  request,
}) => {
  const { defaultAdvanced, references, styles } =
    await import("../src/lib/generationConfig.js");
  expect(styles).toEqual(references.Styles.map((value) => value.name));
  const base = {
    prompt: "Valid landscape",
    count: 1,
    ratio: "1:1",
    model: "Frame 1.0",
    type: "image",
  };
  for (const advanced of [
    null,
    [],
    { ...defaultAdvanced, seed: "-1" },
    { ...defaultAdvanced, seed: "4294967296" },
    { ...defaultAdvanced, guidance: 99 },
    { ...defaultAdvanced, style: "Unknown" },
  ]) {
    const response = await request.post("/api/generate", {
      data: { ...base, advanced },
    });
    expect(response.status()).toBe(400);
  }
  const response = await request.post("/api/generate", {
    data: { ...base, advanced: defaultAdvanced },
  });
  expect(response.status()).toBe(200);
  expect((await response.json()).items).toHaveLength(1);
});
