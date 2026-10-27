import Image from "next/image";

export default function EmptyState({
  onSample,
  type = "image",
  active = true,
  promptCards = [],
}) {
  return (
    <section
      className="empty-state"
      aria-label="Choose a prompt to get started"
    >
      <div className={`prompt-card-deck ${active ? "is-active" : ""}`}>
        {promptCards.map((card, index) => (
          <button
            type="button"
            key={card.title}
            className="prompt-card"
            style={{ "--card-index": index }}
            onPointerMove={(event) => {
              if (event.pointerType !== "mouse") return;
              const cardElement = event.currentTarget;
              const bounds = cardElement.getBoundingClientRect();
              const x = Math.max(
                0,
                Math.min(1, (event.clientX - bounds.left) / bounds.width),
              );
              const y = Math.max(
                0,
                Math.min(1, (event.clientY - bounds.top) / bounds.height),
              );
              cardElement.style.setProperty("--tilt-x", `${(0.5 - y) * 8}deg`);
              cardElement.style.setProperty("--tilt-y", `${(x - 0.5) * 10}deg`);
              cardElement.style.setProperty("--light-x", `${x * 100}%`);
              cardElement.style.setProperty("--light-y", `${y * 100}%`);
            }}
            onPointerLeave={(event) => {
              ["--tilt-x", "--tilt-y", "--light-x", "--light-y"].forEach(
                (property) =>
                  event.currentTarget.style.removeProperty(property),
              );
            }}
            onClick={() => onSample(card.prompt)}
            aria-label={`Use prompt: ${card.title}`}
          >
            <Image
              src={card.src}
              alt={card.alt}
              fill
              sizes="(max-width: 639px) 30vw, (max-width: 1023px) 23vw, 210px"
            />
            <span className="prompt-card-shade" />
            <span className="prompt-card-title">{card.title}</span>
          </button>
        ))}
      </div>
      <h1>{type === "video" ? "Video Studio" : "Image Studio"}</h1>
    </section>
  );
}
