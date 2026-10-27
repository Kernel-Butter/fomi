import Icon from "../Icon";
export default function PromptBox({
  inputRef,
  type,
  prompt,
  setPrompt,
  loading,
  disabled = false,
}) {
  return (
    <div className="prompt-box">
      <label className="sr-only" htmlFor={`${type}-prompt`}>
        Your prompt
      </label>
      <textarea
        ref={inputRef}
        id={`${type}-prompt`}
        value={prompt}
        maxLength={5000}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Describe your imagination to be converted into a piece of art..."
      />
      <button
        className="generate-button"
        type="submit"
        disabled={!prompt.trim() || loading || disabled}
      >
        {loading ? (
          <span className="spinner" />
        ) : (
          <Icon name="sparkle" size={18} />
        )}
        <span>{loading ? "Creating" : "Generate"}</span>
      </button>
    </div>
  );
}
