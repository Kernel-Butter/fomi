import { counts, ratios, models } from "../../lib/generationConfig";
export default function OptionSelects({ options, setOptions }) {
  return (
    <div className="option-selects">
      {[
        {
          key: "count",
          label: "Number of images",
          values: counts,
          format: (v) => `# ${v} ${v === 1 ? "Image" : "Images"}`,
        },
        { key: "ratio", label: "Aspect ratio", values: ratios },
        { key: "model", label: "Model", values: models },
      ].map(({ key, label, values, format }) => (
        <label key={key}>
          <span className="sr-only">{label}</span>
          <select
            value={options[key]}
            onChange={(e) =>
              setOptions((previous) => ({
                ...previous,
                [key]:
                  key === "count" ? Number(e.target.value) : e.target.value,
              }))
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
