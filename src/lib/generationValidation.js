import {
  counts,
  ratios,
  models,
  references,
  samplingSteps,
} from "./generationConfig.js";

export function isValidGenerationRequest(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const { prompt, count, ratio, model, type, advanced } = data;
  if (
    typeof prompt !== "string" ||
    !prompt.trim() ||
    prompt.length > 5000 ||
    !counts.includes(count) ||
    !ratios.includes(ratio) ||
    !models.includes(model) ||
    !["image", "video"].includes(type)
  )
    return false;
  if (advanced === undefined) return true;
  if (!advanced || typeof advanced !== "object" || Array.isArray(advanced))
    return false;
  return (
    references.Styles.some((value) => value.name === advanced.style) &&
    references.Colors.some((value) => value.name === advanced.color) &&
    references.Camera.some((value) => value.name === advanced.camera) &&
    (advanced.seed === "" ||
      (/^\d+$/.test(String(advanced.seed)) &&
        Number(advanced.seed) <= 4294967295)) &&
    typeof advanced.negative === "string" &&
    advanced.negative.length <= 2000 &&
    samplingSteps.includes(advanced.steps) &&
    typeof advanced.guidance === "number" &&
    Number.isFinite(advanced.guidance) &&
    advanced.guidance >= 1 &&
    advanced.guidance <= 20
  );
}
