import { useContext, useRef, useState } from "react";
import ModeToggle from "./ModeToggle";
import PromptBox from "./PromptBox";
import OptionSelects from "./OptionSelects";
import Accordion from "./Accordion";
import AdvancedSettingsModal from "./AdvancedSettingsModal";
import { StudioBackendContext } from "../layout/StudioBackend";
import { saveSettings, resetSettings } from "../../lib/api";
import Icon from "../Icon";

export default function ControlPanel({
  promptRef,
  type,
  active,
  prompt,
  setPrompt,
  loading,
  onGenerate,
}) {
  const { config, sessionId, initialSettings } =
    useContext(StudioBackendContext);
  const [settings, setSettings] = useState(initialSettings[type]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const pendingSave = useRef(false);
  const failedSave = useRef(null);

  async function persist(next, { optimistic = true, reset = false } = {}) {
    if (pendingSave.current) return false;
    pendingSave.current = true;
    const previous = settings;
    if (optimistic) setSettings(next);
    setSaving(true);
    setError("");
    try {
      const result = reset
        ? await resetSettings(sessionId, type)
        : await saveSettings(sessionId, type, next);
      setSettings(result.settings);
      failedSave.current = null;
      return true;
    } catch (requestError) {
      if (optimistic) setSettings(previous);
      failedSave.current = next;
      setError(requestError.message);
      return false;
    } finally {
      pendingSave.current = false;
      setSaving(false);
    }
  }
  function submit(event) {
    event.preventDefault();
    if (!loading && !pendingSave.current)
      onGenerate({
        ...settings.options,
        type,
        prompt,
        advanced: settings.advanced,
      });
  }
  return (
    <aside className="control-panel" aria-label="Generation controls">
      <form
        onSubmit={submit}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter")
            submit(event);
        }}
      >
        <ModeToggle type={type} />
        <PromptBox
          inputRef={promptRef}
          type={type}
          prompt={prompt}
          setPrompt={setPrompt}
          loading={loading}
          disabled={saving}
        />
        <OptionSelects
          type={type}
          config={config}
          disabled={saving}
          options={settings.options}
          onChange={(options) => persist({ ...settings, options })}
        />
        <div className="settings-save-status" role="status" aria-live="polite">
          {saving ? "Saving settings…" : ""}
        </div>
        {error && !modalOpen && (
          <div className="settings-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist(failedSave.current)}
            >
              Retry saving
            </button>
          </div>
        )}
        <button
          type="button"
          className="advanced-settings-trigger"
          aria-haspopup="dialog"
          disabled={saving}
          onClick={() => {
            setError("");
            setModalOpen(true);
          }}
        >
          <span>Advanced settings</span>
          <Icon name="wand" size={16} />
        </button>
        <Accordion title="Styles">
          <div className="style-chips">
            {config.styles.map((style) => (
              <button
                type="button"
                key={style}
                disabled={saving}
                aria-pressed={settings.advanced.style === style}
                className={settings.advanced.style === style ? "selected" : ""}
                onClick={() =>
                  persist({
                    ...settings,
                    advanced: { ...settings.advanced, style },
                  })
                }
              >
                {style}
              </button>
            ))}
          </div>
        </Accordion>
      </form>
      <AdvancedSettingsModal
        config={config}
        type={type}
        open={modalOpen}
        active={active}
        value={settings.advanced}
        saving={saving}
        error={modalOpen ? error : ""}
        onApply={async (advanced) => {
          const reset =
            JSON.stringify(advanced) === JSON.stringify(config.defaultAdvanced);
          if (
            await persist(
              { ...settings, advanced },
              { optimistic: false, reset },
            )
          )
            setModalOpen(false);
        }}
        onDismiss={() => {
          if (!pendingSave.current) setModalOpen(false);
        }}
      />
    </aside>
  );
}
