import GenerationGroup from "./GenerationGroup";
import EmptyState from "./EmptyState";
import { useContext } from "react";
import { StudioBackendContext } from "../layout/StudioBackend";
export default function ResultsFeed({
  onRetry,
  onRetryHistory,
  busy,
  groups,
  onSample,
  error,
  historyRetryLabel,
  type,
  active,
  registerGroup,
}) {
  const { config } = useContext(StudioBackendContext);
  return (
    <>
      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetryHistory}>
            {historyRetryLabel}
          </button>
        </div>
      )}
      {groups.length ? (
        <div className="results-feed">
          {groups.map((group, i) => (
            <GenerationGroup
              onRetry={onRetry}
              busy={busy}
              active={active}
              registerGroup={registerGroup}
              key={group.id}
              group={group}
              first={i === 0}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          promptCards={config.promptCards[type]}
          active={active}
          type={type}
          onSample={onSample}
        />
      )}
    </>
  );
}
