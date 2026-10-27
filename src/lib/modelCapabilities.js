export function findModel(config, id, type) {
  return config.models.find(
    (model) => model.id === id && model.types.includes(type),
  );
}

// Keep UI selections valid when switching to a model with different capabilities.
export function normalizeSettings(settings, type, config) {
  const model =
    findModel(config, settings.options.model, type) ||
    config.models.find((value) => value.types.includes(type));
  if (!model) throw new Error("No models are available for this studio.");
  const advanced = { ...settings.advanced };
  for (const setting of Object.keys(config.defaultAdvanced)) {
    if (!model.settings.includes(setting))
      advanced[setting] = config.defaultAdvanced[setting];
  }
  if (!model.samplingSteps.includes(advanced.steps))
    advanced.steps = model.samplingSteps.includes(config.defaultAdvanced.steps)
      ? config.defaultAdvanced.steps
      : model.samplingSteps[0];
  const guidance =
    model.guidance.min +
    Math.round((advanced.guidance - model.guidance.min) / model.guidance.step) *
      model.guidance.step;
  advanced.guidance = Math.max(
    model.guidance.min,
    Math.min(model.guidance.max, guidance),
  );
  return {
    options: {
      model: model.id,
      count: model.counts.includes(settings.options.count)
        ? settings.options.count
        : model.counts.at(-1),
      ratio: model.ratios.includes(settings.options.ratio)
        ? settings.options.ratio
        : model.ratios[0],
    },
    advanced,
  };
}
