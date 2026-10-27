import { useState } from "react";
import ModeToggle from "./ModeToggle";
import PromptBox from "./PromptBox";
import OptionSelects from "./OptionSelects";
import Accordion from "./Accordion";
import AdvancedSettingsModal from "./AdvancedSettingsModal";
import { styles, defaultAdvanced } from "../../lib/generationConfig";
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
  const [options, setOptions] = useState({
    count: 4,
    ratio: "3:4",
    model: "Frame 1.0",
  });
  const [advanced, setAdvanced] = useState({ ...defaultAdvanced });
  const [modalOpen, setModalOpen] = useState(false);
  function submit(event) {
    event.preventDefault();
    if (!loading) onGenerate({ ...options, type, prompt, advanced });
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
        />
        <OptionSelects options={options} setOptions={setOptions} />
        <button
          type="button"
          className="advanced-settings-trigger"
          aria-haspopup="dialog"
          onClick={() => setModalOpen(true)}
        >
          <span>Advanced settings</span>
          <Icon name="wand" size={16} />
        </button>
        <Accordion title="Styles">
          <div className="style-chips">
            {styles.map((style) => (
              <button
                type="button"
                key={style}
                aria-pressed={advanced.style === style}
                className={advanced.style === style ? "selected" : ""}
                onClick={() =>
                  setAdvanced((previous) => ({ ...previous, style }))
                }
              >
                {style}
              </button>
            ))}
          </div>
        </Accordion>
      </form>
      <AdvancedSettingsModal
        type={type}
        open={modalOpen}
        active={active}
        value={advanced}
        onApply={(settings) => {
          setAdvanced(settings);
          setModalOpen(false);
        }}
        onDismiss={() => setModalOpen(false)}
      />
    </aside>
  );
}
