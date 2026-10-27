import { createHash, randomInt, randomUUID } from "node:crypto";
import { defaultAdvanced, limits } from "../generationConfig.js";

function fingerprint(value) {
  return Number.parseInt(
    createHash("sha256").update(value).digest("hex").slice(0, 8),
    16,
  );
}
export function resolveGeneration(options) {
  const advanced = { ...defaultAdvanced, ...options.advanced };
  const seed =
    advanced.seed === ""
      ? randomInt(limits.seed.min, limits.seed.max + limits.seed.step)
      : Number(advanced.seed);
  return { ...options, advanced: { ...advanced, seed: String(seed) } };
}
export function makeOutputs(job) {
  const { prompt, count, ratio, model, type, advanced } = job;
  const hash = fingerprint(JSON.stringify({ prompt, model, type, advanced }));
  const [width, height] = ratio.split(":").map(Number);
  const palette = {
    Original: "",
    "Ocean Mist": "saturate(.7) hue-rotate(10deg)",
    "Golden Hour": "sepia(.28) saturate(1.2)",
    "Soft Pastel": "saturate(.7) contrast(.9) brightness(1.08)",
  }[advanced.color];
  const style = {
    Natural: "",
    Cinematic: "contrast(1.12)",
    Analog: "sepia(.2) contrast(.95)",
    Editorial: "contrast(1.05) saturate(.9)",
    Dreamscape: "saturate(1.25)",
    Minimal: "saturate(.55)",
  }[advanced.style];
  const position = {
    Auto: "50% 50%",
    "Close-up": "50% 35%",
    "Wide Angle": "50% 65%",
    "Low Angle": "50% 85%",
  }[advanced.camera];
  return Array.from({ length: count }, (_, index) => {
    const image = ((hash + index * 5) % 16) + 1;
    const clip = ((hash + index) % 2) + 1;
    return {
      id: randomUUID(),
      type,
      src:
        type === "video"
          ? `/videos/sample-${clip}.mp4`
          : `/images/sample-${image}.jpg`,
      poster:
        type === "video"
          ? `/images/sample-${clip === 1 ? 6 : 11}.jpg`
          : `/images/sample-${image}.jpg`,
      width: 768,
      height: Math.round((768 * height) / width),
      prompt,
      model,
      seed: advanced.seed,
      presentation: {
        filter: [palette, style].filter(Boolean).join(" ") || "none",
        objectPosition: position,
      },
    };
  });
}
export function durationFor(options) {
  return (
    (options.type === "video" ? 1900 : 1100) +
    options.advanced.steps * 12 +
    options.count * 80
  );
}
