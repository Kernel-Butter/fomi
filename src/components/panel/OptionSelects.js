export default function OptionSelects({
  type,
  config,
  options,
  onChange,
  disabled,
}) {
  const noun = type === "video" ? "Video" : "Image";
  return (
    <div className="option-selects">
      {[
        {
          key: "count",
          label: `Number of ${noun.toLowerCase()}s`,
          values: config.counts,
          format: (value) => `# ${value} ${noun}${value === 1 ? "" : "s"}`,
        },
        { key: "ratio", label: "Aspect ratio", values: config.ratios },
        { key: "model", label: "Model", values: config.models },
      ].map(({ key, label, values, format }) => (
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
              <option key={value} value={value}>
                {format ? format(value) : value}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
