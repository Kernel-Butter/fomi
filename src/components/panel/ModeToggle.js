import Link from "../navigation/AppLink";

export default function ModeToggle({ type, features }) {
  return (
    <nav className="mode-toggle" aria-label="Generation type">
      {["image", "video"].map((mode) => (
        <Link
          key={mode}
          aria-disabled={!features[mode]}
          onClick={(event) => {
            if (!features[mode]) event.preventDefault();
          }}
          href={mode === "image" ? "/imagestudio" : "/videostudio"}
          aria-current={type === mode ? "page" : undefined}
          className={type === mode ? "selected" : ""}
        >
          {mode === "image" ? "Image" : "Video"}
        </Link>
      ))}
    </nav>
  );
}
