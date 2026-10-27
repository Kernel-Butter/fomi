export default function Icon({ name, size = 18, ...props }) {
  const paths = {
    menu: "M4 6h16M4 12h16M4 18h16",
    profile: "M20 21v-2a7 7 0 0 0-14 0v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
    previous: "m15 5-7 7 7 7",
    next: "m9 5 7 7-7 7",
    close: "M6 6l12 12M18 6 6 18",
    expand: "M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5",
    home: "m3 10 9-7 9 7v10h-6v-6H9v6H3Z",
    image: "M4 4h16v16H4ZM4 16l5-5 4 4 3-3 4 4M15 8h.01",
    video: "M3 6h12v12H3ZM15 10l6-4v12l-6-4",
    wand: "m4 20 12-12 4 4L8 24M14 3v4M3 8h4M6 2l2 2M20 2l-2 2",
    folder: "M3 6h7l2 2h9v12H3Z",
    sparkle:
      "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4",
    gallery: "M8 3H4v17h16v-4M10 4h10v10H10ZM10 14l4-5 6 5",
    support:
      "M4 14v-3a8 8 0 0 1 16 0v3M4 11H2v7h4v-7ZM20 11h2v7h-4v-7M18 18v3h-6",
    chevron: "m8 10 4 4 4-4",
    play: "m9 5 11 7-11 7Z",
    arrow: "M5 12h14m-5-5 5 5-5 5",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.sparkle} />
    </svg>
  );
}
