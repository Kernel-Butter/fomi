import Image from "next/image";
import Icon from "../Icon";

export default function HistoryStrip({
  type,
  onSelect,
  stripRef,
  historyGroups = [],
}) {
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
              className={`history-deck ${stacked ? "is-stacked" : ""}`}
              role="group"
              aria-label={`Generation: ${group.prompt}`}
              style={{ "--image-count": group.items.length }}
            >
              {group.items.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className="history-preview"
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
      <div className="history-fade" />
    </section>
  );
}
