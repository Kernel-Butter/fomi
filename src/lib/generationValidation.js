import {
  defaultAdvanced,
  features,
  limits,
  models,
  references,
} from "./generationConfig.js";

export function isValidGenerationOptions(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const { count, ratio, model: modelId, type, advanced } = data;
  const model = models.find(
    (value) => value.id === modelId && value.types.includes(type),
  );
  if (
    !model ||
    !features[type] ||
    !model.counts.includes(count) ||
    !model.ratios.includes(ratio)
  )
    return false;
  if (advanced === undefined) return true;
  if (!advanced || typeof advanced !== "object" || Array.isArray(advanced))
    return false;
  if (model.settings.some((setting) => !(setting in advanced))) return false;
  if (
    Object.keys(defaultAdvanced).some(
      (setting) =>
        !model.settings.includes(setting) &&
        advanced[setting] !== defaultAdvanced[setting],
    )
  )
    return false;
  const guidanceSteps =
    (advanced.guidance - model.guidance.min) / model.guidance.step;
  return (
    references.Styles.some((value) => value.name === advanced.style) &&
    references.Colors.some((value) => value.name === advanced.color) &&
    references.Camera.some((value) => value.name === advanced.camera) &&
    (advanced.seed === "" ||
      (/^\d+$/.test(String(advanced.seed)) &&
        Number(advanced.seed) >= limits.seed.min &&
        Number(advanced.seed) <= limits.seed.max)) &&
    typeof advanced.negative === "string" &&
    advanced.negative.length <= limits.negative.maxLength &&
    model.samplingSteps.includes(advanced.steps) &&
    typeof advanced.guidance === "number" &&
    Number.isFinite(advanced.guidance) &&
    advanced.guidance >= model.guidance.min &&
    advanced.guidance <= model.guidance.max &&
    Math.abs(guidanceSteps - Math.round(guidanceSteps)) < 1e-8
  );
}

export function isValidGenerationRequest(data) {
  return (
    !!data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    typeof data.prompt === "string" &&
    !!data.prompt.trim() &&
    data.prompt.length <= limits.prompt.maxLength &&
    isValidGenerationOptions(data)
  );
}

export function isValidStudioSettings(value, type) {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !!value.options &&
    typeof value.options === "object" &&
    !Array.isArray(value.options) &&
    value.advanced !== undefined &&
    isValidGenerationOptions({
      ...value.options,
      type,
      advanced: value.advanced,
    })
  );
}
