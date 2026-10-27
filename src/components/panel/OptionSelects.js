export default function OptionSelects({
  type,
  config,
  options,
  onChange,
  disabled,
}) {
  const noun = type === "video" ? "Video" : "Image";
  const availableModels = config.models.filter((model) =>
    model.types.includes(type),
  );
  const model = availableModels.find((value) => value.id === options.model);
  return (
    <div className="option-selects">
      {[
        {
          key: "count",
          label: `Number of ${noun.toLowerCase()}s`,
          values: model.counts.map((value) => ({
            id: value,
            name: `# ${value} ${noun}${value === 1 ? "" : "s"}`,
          })),
        },
        {
          key: "ratio",
          label: "Aspect ratio",
          values: model.ratios.map((value) => ({ id: value, name: value })),
        },
        { key: "model", label: "Model", values: availableModels },
      ].map(({ key, label, values }) => (
        <label key={key}>
          <span className="sr-only">{label}</span>
          <select
            disabled={disabled}
            aria-label={label}
            value={options[key]}
            onChange={(event) =>
              onChange({
                ...options,
                [key]:
                  key === "count"
                    ? Number(event.target.value)
                    : event.target.value,
              })
            }
          >
            {values.map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
