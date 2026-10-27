import { memo } from "react";
import PromptBubble from "./PromptBubble";
import ResultCard from "./ResultCard";
import Skeletons from "./Skeletons";

function GenerationGroup({
  group,
  first,
  active,
  registerGroup,
  onRetry,
  busy,
}) {
  return (
    <section
      ref={(element) => registerGroup(group.id, element)}
      id={`generation-${group.id}`}
      className="generation-group"
      aria-label={
        group.loading
          ? "Generation in progress"
          : group.status === "failed"
            ? "Failed generation"
            : "Generated results"
      }
      aria-busy={group.loading}
    >
      <div className="conversation-details">
        <PromptBubble prompt={group.prompt} model={group.model} />
        {group.loading && (
          <div className="job-status">
            <span>
              {group.status === "queued" ? "Queued" : "Generating"} ·{" "}
              {group.progress || 0}%
            </span>
            <progress
              aria-label="Generation progress"
              max="100"
              value={group.progress || 0}
            />
          </div>
        )}
        {group.status === "completed" && group.advanced?.seed && (
          <p className="generation-seed">Seed {group.advanced.seed}</p>
        )}
      </div>
      {group.status === "failed" ? (
        <div className="generation-failure" role="alert">
          <p>{group.error || "Generation failed. Please try again."}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRetry(group.id)}
          >
            Retry generation
          </button>
        </div>
      ) : (
        <div className="result-grid">
          {group.loading ? (
            <Skeletons count={group.count} ratio={group.ratio} />
          ) : (
            group.items.map((item, index) => (
              <ResultCard
                active={active}
                key={item.id}
                item={item}
                index={index}
                priority={first && index < 4}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}
export default memo(GenerationGroup);
