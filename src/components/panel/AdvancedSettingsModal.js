import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { normalizeSettings } from "../../lib/modelCapabilities";
export default function AdvancedSettingsModal({
  config,
  model,
  saving,
  error,
  open,
  active,
  value,
  onApply,
  onDismiss,
  type,
}) {
  const { references, limits } = config;
  const defaultAdvanced = normalizeSettings(
    {
      options: { ...config.defaultOptions, model: model.id },
      advanced: config.defaultAdvanced,
    },
    type,
    config,
  ).advanced;
  const samplingSteps = model.samplingSteps;
  const dialogRef = useRef(null);
  const [tab, setTab] = useState("Styles");
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && active) {
      setDraft({ ...value });
      setTab("Styles");
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [open, active, value]);
  const field =
    tab === "Styles" ? "style" : tab === "Colors" ? "color" : "camera";
  function update(key, next) {
    setDraft((previous) => ({ ...previous, [key]: next }));
  }
  return (
    <dialog
      ref={dialogRef}
      className="advanced-modal"
      aria-labelledby={`${type}-advanced-title`}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClose={onDismiss}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onDismiss();
      }}
    >
      <div className="advanced-modal-top">
        <span className="advanced-badge">✦ Creative controls</span>
        <button
          type="button"
          className="modal-close"
          aria-label="Close advanced settings"
          disabled={saving}
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
      <div className="advanced-modal-body">
        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}
        <h2 id={`${type}-advanced-title`}>Advanced settings</h2>
        <p className="advanced-intro">
          Set the mood. Shape the details. Make it yours.
        </p>
        <div
          className="reference-tabs"
          role="group"
          aria-label="Reference category"
        >
          {Object.keys(references).map((name) => (
            <button
              type="button"
              key={name}
              disabled={
                saving ||
                !model.settings.includes(
                  name === "Styles"
                    ? "style"
                    : name === "Colors"
                      ? "color"
                      : "camera",
                )
              }
              aria-pressed={tab === name}
              onClick={() => setTab(name)}
            >
              {name === "Styles" ? "☆" : name === "Colors" ? "◉" : "◎"}{" "}
              <span>{name}</span>
            </button>
          ))}
        </div>
        <div
          className="reference-grid"
          role="group"
          aria-label={`Choose ${tab.toLowerCase()}`}
        >
          {references[tab].map((reference) => (
            <button
              type="button"
              disabled={saving || !model.settings.includes(field)}
              key={reference.name}
              className={`reference-card ${draft[field] === reference.name ? "is-selected" : ""}`}
              aria-pressed={draft[field] === reference.name}
              onClick={() => update(field, reference.name)}
            >
              <span className="reference-art">
                <Image
                  src={reference.imageUrl}
                  alt={reference.detail}
                  fill
                  sizes="(max-width: 639px) 40vw, 240px"
                />
                {draft[field] === reference.name && (
                  <span className="reference-check" aria-hidden="true">
                    ✓
                  </span>
                )}
                {reference.colors && (
                  <span className="reference-palette">
                    {reference.colors.map((color) => (
                      <span key={color} style={{ background: color }} />
                    ))}
                  </span>
                )}
              </span>
              <strong>{reference.name}</strong>
              <span className="reference-description">{reference.detail}</span>
            </button>
          ))}
        </div>
        <section
          className="advanced-parameters"
          aria-label="Generation parameters"
        >
          <label className="advanced-field" htmlFor={`${type}-seed`}>
            Seed
            <span className="advanced-hint">
              Leave empty for a random starting point
            </span>
            <input
              disabled={saving || !model.settings.includes("seed")}
              id={`${type}-seed`}
              type="number"
              min={limits.seed.min}
              max={limits.seed.max}
              step={limits.seed.step}
              placeholder="Random"
              value={draft.seed}
              onChange={(event) => update("seed", event.target.value)}
            />
          </label>
          <label className="advanced-field" htmlFor={`${type}-steps`}>
            Sampling steps
            <span className="advanced-hint">Refinement per generation</span>
            <select
              disabled={saving || !model.settings.includes("steps")}
              id={`${type}-steps`}
              value={draft.steps}
              onChange={(event) => update("steps", Number(event.target.value))}
            >
              {samplingSteps.map((steps) => (
                <option key={steps} value={steps}>
                  {steps} steps
                </option>
              ))}
            </select>
          </label>
          <label
            className="advanced-field advanced-guidance"
            htmlFor={`${type}-guidance`}
          >
            Prompt guidance <output>{draft.guidance}</output>
            <span className="advanced-hint">
              Balance creative freedom and prompt detail
            </span>
            <input
              id={`${type}-guidance`}
              type="range"
              disabled={saving || !model.settings.includes("guidance")}
              min={model.guidance.min}
              max={model.guidance.max}
              step={model.guidance.step}
              value={draft.guidance}
              onChange={(event) =>
                update("guidance", Number(event.target.value))
              }
            />
            <span className="range-labels">
              <span>More creative</span>
              <span>More precise</span>
            </span>
          </label>
          <label
            className="advanced-field advanced-negative"
            htmlFor={`${type}-negative`}
          >
            Negative prompt
            <span className="advanced-hint">
              Details you would like to leave out
            </span>
            <textarea
              disabled={saving || !model.settings.includes("negative")}
              id={`${type}-negative`}
              rows="2"
              maxLength={limits.negative.maxLength}
              placeholder="Blur, distortion, unwanted text…"
              value={draft.negative}
              onChange={(event) => update("negative", event.target.value)}
            />
          </label>
        </section>
      </div>
      <footer className="advanced-modal-footer">
        <button
          type="button"
          className="modal-reset"
          disabled={saving}
          onClick={() => setDraft({ ...defaultAdvanced })}
        >
          Reset defaults
        </button>
        <div>
          <button
            type="button"
            className="modal-cancel"
            disabled={saving}
            onClick={onDismiss}
          >
            Cancel
          </button>
          <button
            type="button"
            className="modal-apply"
            disabled={saving}
            onClick={() => {
              if (dialogRef.current.querySelector(":invalid")) {
                dialogRef.current.querySelector(":invalid").reportValidity();
                return;
              }
              onApply(draft);
            }}
          >
            {saving ? "Saving..." : "Apply settings"}
          </button>
        </div>
      </footer>
    </dialog>
  );
}
