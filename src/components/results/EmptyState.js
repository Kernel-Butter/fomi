import Image from "next/image";

const imagePromptCards = [
  {
    title: "Edge of Wonder",
    src: "/images/sample-12.jpg",
    alt: "Golden light over a dramatic mountain valley",
    prompt:
      "A breathtaking mountain valley with rugged cliffs and golden morning light, cinematic landscape photography, rich natural detail.",
  },
  {
    title: "Starlit Escape",
    src: "/images/sample-9.jpg",
    alt: "Snowy mountains beneath a luminous star-filled sky",
    prompt:
      "A quiet snow-covered mountain range beneath a glowing Milky Way and pastel night sky, dreamy cinematic lighting, immense scale.",
  },
  {
    title: "Neon Muse",
    src: "/images/sample-1.jpg",
    alt: "A portrait illuminated by soft blue and violet light",
    prompt:
      "An editorial portrait illuminated by soft blue and violet neon light, a calm expression, futuristic atmosphere, detailed cinematic photography.",
  },
  {
    title: "Hidden Path",
    src: "/images/sample-7.jpg",
    alt: "A winding trail through a sunlit green forest",
    prompt:
      "A mysterious woodland path winding between tall trees, sunlight filtering through lush green leaves, enchanting atmosphere, cinematic depth.",
  },
];

const videoPromptCards = [
  {
    title: "Alpine Drift",
    src: "/images/sample-5.jpg",
    alt: "A rowboat drifting across a turquoise alpine lake",
    prompt:
      "A cinematic tracking shot gliding beside a wooden rowboat on a turquoise alpine lake. Oars move gently, ripples spread across clear water, and the camera slowly reveals towering mountains. Smooth natural motion, a seamless six-second shot.",
  },
  {
    title: "Ocean Rhythm",
    src: "/images/sample-6.jpg",
    alt: "Soft ocean waves beneath a pastel sky",
    prompt:
      "A water-level cinematic shot of gentle ocean swells rising and falling under a pastel sky. The camera floats with the waves as soft light shimmers across the surface. Slow tranquil movement, a seamless six-second loop.",
  },
  {
    title: "First Light",
    src: "/images/sample-10.jpg",
    alt: "Golden sunlight breaking over layered mountain ridges",
    prompt:
      "A cinematic sunrise time-lapse over layered mountain ridges. Golden light spills over the peaks while mist drifts through the valleys. A slow forward camera push, warm atmospheric color, six seconds of continuous motion.",
  },
  {
    title: "Lakeside Reverie",
    src: "/images/sample-11.jpg",
    alt: "A wooden lakeside cabin beneath misty mountains",
    prompt:
      "A slow cinematic dolly shot toward a wooden cabin on a still mountain lake. Wisps of fog drift between pine trees, reflections ripple gently, and nearby branches sway in the breeze. A peaceful six-second establishing shot.",
  },
];
export default function EmptyState({
  onSample,
  type = "image",
  active = true,
}) {
  const promptCards = type === "video" ? videoPromptCards : imagePromptCards;
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
