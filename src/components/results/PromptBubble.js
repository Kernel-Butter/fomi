export default function PromptBubble({ prompt, model, createdAt }) {
  const date = new Date(createdAt);
  const hasDate = Number.isFinite(createdAt) && !Number.isNaN(date.getTime());
  return (
    <div className="prompt-bubble">
      <p>{prompt}</p>
      {hasDate && (
        <time
          className="generation-timestamp"
          dateTime={date.toISOString()}
          title={date.toLocaleString(undefined, {
            dateStyle: "full",
            timeStyle: "long",
          })}
        >
          {date.toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      )}
      <span title={model} className="model-chip">
        Model <span>{model}</span>
      </span>
    </div>
  );
}
