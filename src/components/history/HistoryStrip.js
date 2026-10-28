import Image from "next/image";
import Icon from "../Icon";
import useHistoryScroll from "../../hooks/useHistoryScroll";

export default function HistoryStrip({
  type,
  onSelect,
  stripRef,
  historyGroups = [],
  currentId,
  open,
}) {
  const { before, after, slide } = useHistoryScroll(stripRef, currentId, open);
  return (
    <section
      className="history-strip"
      aria-label={`${type === "video" ? "Video" : "Image"} generation history`}
    >
      <div className="history-label">
        <strong>History</strong>
        <button
          type="button"
          onClick={() =>
            stripRef.current?.scrollTo({
              left: stripRef.current.scrollWidth,
              behavior: "smooth",
            })
          }
        >
          View All
        </button>
      </div>
      <button
        type="button"
        className="history-slide"
        aria-label="Previous history"
        disabled={!before}
        onClick={() => slide(-1)}
      >
        <Icon name="previous" size={16} />
      </button>
      <div
        className="history-scroll"
        ref={stripRef}
        tabIndex={0}
        aria-label="Browse history"
      >
        {historyGroups.map((group) => {
          const stacked = group.items.length > 1;
          return (
            <div
              key={group.id}
              data-history-id={group.id}
              className={`history-deck ${stacked ? "is-stacked" : ""} ${currentId === group.id ? "is-current" : ""}`}
              role="group"
              aria-label={`Generation: ${group.prompt}`}
              style={{ "--image-count": group.items.length }}
            >
              {group.items.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className="history-preview"
                  aria-current={currentId === group.id ? "true" : undefined}
                  style={{
                    "--image-index": index,
                    zIndex: group.items.length - index,
                  }}
                  onClick={() => onSelect(group.id)}
                  aria-label={`Open ${type} ${index + 1} of ${group.items.length}: ${group.prompt}`}
                >
                  <Image
                    src={item.poster || item.src}
                    style={item.presentation}
                    alt={group.prompt}
                    fill
                    sizes="72px"
                  />
                  {type === "video" && (
                    <span className="history-video">
                      <Icon name="play" size={12} />
                    </span>
                  )}
                </button>
              ))}
              {stacked && (
                <span className="history-count" aria-hidden="true">
                  {group.items.length}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="history-slide"
        aria-label="Next history"
        disabled={!after}
        onClick={() => slide(1)}
      >
        <Icon name="next" size={16} />
      </button>
    </section>
  );
}
