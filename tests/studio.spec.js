import { chooseOption, selectedControl } from "./helpers/select";
import { test, expect } from "@playwright/test";

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
  await expect(
    current.getByRole("status", { name: "Generation updates" }),
  ).toContainText("ready");
  await expect(
    current.getByRole("button", { name: "Generate", exact: true }),
  ).toBeEnabled();
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
  await page.goto("/imagestudio");
  const image = studio(page);
  await expect(image.getByRole("button", { name: "Show history" })).toHaveCount(
    0,
  );
  await chooseOption(
    image.getByRole("combobox", { name: "Aspect ratio" }),
    "16:9",
  );
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
  await expect(selectedControl(image, "Aspect ratio")).toContainText("16:9");
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
  await expect(image.locator(".history-deck.is-current")).toHaveAttribute(
    "aria-label",
    "Generation: First conversation",
  );
  const historyList = image.locator(".history-scroll");
  await historyList.evaluate((element) => {
    element.style.maxWidth = "180px";
    element.scrollLeft = element.scrollWidth;
  });
  const next = image.getByRole("button", {
    name: "Previous history",
    exact: true,
  });
  await expect(next).toBeVisible();
  const initialLeft = await historyList.evaluate(
    (element) => element.scrollLeft,
  );
  await next.click();
  await expect
    .poll(() => historyList.evaluate((element) => element.scrollLeft))
    .toBeLessThan(initialLeft);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const direction of [-1, 1]) {
    const arrow = image.getByRole("button", {
      name: direction < 0 ? "Previous history" : "Next history",
      exact: true,
      includeHidden: true,
    });
    for (let step = 0; step < 10 && (await arrow.isEnabled()); step++) {
      const target = await historyList.evaluate(
        (element, direction) =>
          Math.max(
            0,
            Math.min(
              element.scrollWidth - element.clientWidth,
              element.scrollLeft + direction * element.clientWidth * 0.8,
            ),
          ),
        direction,
      );
      await arrow.click();
      await expect
        .poll(() => historyList.evaluate((element) => element.scrollLeft))
        .toBeCloseTo(target, 0);
    }
    await expect(arrow).toBeDisabled();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await historyList.focus();
  await image.locator(".results-scroll").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(image.locator(".history-deck.is-current")).toHaveAttribute(
    "aria-label",
    "Generation: Conversation 5",
  );
  await expect(image.locator(".history-deck.is-current")).toBeInViewport();
  await image.locator(".results-scroll").evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(image.locator(".history-deck.is-current")).toHaveAttribute(
    "aria-label",
    "Generation: First conversation",
  );
  await expect
    .poll(() =>
      historyList.evaluate((element) => {
        const item = element.querySelector(".is-current");
        return (
          item.getBoundingClientRect().left >=
            element.getBoundingClientRect().left - 1 &&
          item.getBoundingClientRect().right <=
            element.getBoundingClientRect().right + 1
        );
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      image.locator(".results-scroll").evaluate((element) => element.scrollTop),
    )
    .toBeLessThan(8);
});

test("video pauses when leaving its retained studio", async ({ page }) => {
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
    if (viewport.width <= 1023)
      await studio(page)
        .getByRole("button", { name: "Create image", exact: true })
        .click();
    await studio(page)
      .getByRole("button", { name: "Advanced settings", exact: true })
      .click();
    const box = await page
      .getByRole("dialog", { name: "Advanced settings", exact: true })
      .boundingBox();
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
  const session = await (await request.post("/api/sessions")).json();
  const response = await request.post("/api/generate", {
    headers: { "X-Session-ID": session.id },
    data: { ...base, advanced: defaultAdvanced },
  });
  expect(response.status()).toBe(202);
  expect((await response.json()).job.status).toBe("queued");
});
