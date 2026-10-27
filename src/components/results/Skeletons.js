export default function Skeletons({ count, ratio }) {
  return Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className="result-skeleton"
      style={{ aspectRatio: ratio.replace(":", " / ") }}
      aria-label="Generating image"
    >
      <div />
    </div>
  ));
}
