export const defaultAdvanced = {
  style: "Natural",
  color: "Original",
  camera: "Auto",
  seed: "",
  negative: "",
  guidance: 7,
  steps: 28,
};
export const references = {
  Styles: [
    {
      name: "Natural",
      imageUrl: "/images/sample-7.jpg",
      detail: "True-to-life light and texture",
    },
    {
      name: "Cinematic",
      imageUrl: "/images/sample-9.jpg",
      detail: "Atmospheric depth and contrast",
    },
    {
      name: "Analog",
      imageUrl: "/images/sample-10.jpg",
      detail: "Warm grain and nostalgic tones",
    },
    {
      name: "Editorial",
      imageUrl: "/images/sample-1.jpg",
      detail: "Clean composition and detail",
    },
    {
      name: "Dreamscape",
      imageUrl: "/images/sample-9.jpg",
      detail: "Luminous worlds and imaginative detail",
    },
    {
      name: "Minimal",
      imageUrl: "/images/sample-6.jpg",
      detail: "Quiet forms and uncluttered composition",
    },
  ],
  Colors: [
    {
      name: "Original",
      imageUrl: "/images/sample-5.jpg",
      detail: "Keep the scene’s natural colors",
      colors: ["#a7c5bf", "#318f8c", "#497a51", "#d7c8a9"],
    },
    {
      name: "Ocean Mist",
      imageUrl: "/images/sample-6.jpg",
      detail: "Cool, quiet, and softly muted",
      colors: ["#174a58", "#52828c", "#acc3c1", "#dee2d7"],
    },
    {
      name: "Golden Hour",
      imageUrl: "/images/sample-10.jpg",
      detail: "Sunlit amber and warm shadows",
      colors: ["#bd6d43", "#ecae71", "#f6d6a6", "#594d41"],
    },
    {
      name: "Soft Pastel",
      imageUrl: "/images/sample-9.jpg",
      detail: "Airy pinks and gentle lavender",
      colors: ["#b2becf", "#ddc0d2", "#b7a6c6", "#e9e0e3"],
    },
  ],
  Camera: [
    {
      name: "Auto",
      imageUrl: "/images/sample-12.jpg",
      detail: "A balanced view of the scene",
    },
    {
      name: "Close-up",
      imageUrl: "/images/sample-1.jpg",
      detail: "Intimate framing and fine detail",
    },
    {
      name: "Wide Angle",
      imageUrl: "/images/sample-5.jpg",
      detail: "Open landscapes and a sense of scale",
    },
    {
      name: "Low Angle",
      imageUrl: "/images/sample-7.jpg",
      detail: "A bold perspective looking upward",
    },
  ],
};

export const styles = references.Styles.map((reference) => reference.name);
export const counts = [1, 2, 3, 4];
export const ratios = ["1:1", "3:4", "16:9"];
export const limits = {
  prompt: { maxLength: 5000 },
  negative: { maxLength: 2000 },
  seed: { min: 0, max: 4294967295, step: 1 },
  guidance: { min: 1, max: 20, step: 0.5 },
};
export const features = {
  home: false,
  image: true,
  video: true,
  wand: false,
  folder: false,
  gallery: true,
  support: true,
};
export const application = {
  support: { href: "mailto:support@frame.example", label: "Contact support" },
};
const allSettings = [
  "style",
  "color",
  "camera",
  "seed",
  "negative",
  "guidance",
  "steps",
];
export const models = [
  {
    id: "Frame 1.0",
    name: "Frame 1.0",
    types: ["image", "video"],
    counts: [1, 2, 3, 4],
    ratios: ["1:1", "3:4", "16:9"],
    samplingSteps: [16, 24, 28, 36, 50],
    settings: allSettings,
    guidance: limits.guidance,
  },
  {
    id: "Flux",
    name: "Flux",
    types: ["image"],
    counts: [1, 2, 3, 4],
    ratios: ["1:1", "3:4", "16:9"],
    samplingSteps: [16, 24, 28, 36],
    settings: allSettings.filter((setting) => setting !== "camera"),
    guidance: { min: 1, max: 15, step: 0.5 },
  },
  {
    id: "Studio",
    name: "Studio",
    types: ["image", "video"],
    counts: [1, 2],
    ratios: ["16:9", "1:1"],
    samplingSteps: [16, 24, 28],
    settings: allSettings,
    guidance: { min: 1, max: 12, step: 0.5 },
  },
];
export const samplingSteps = [16, 24, 28, 36, 50];

export const defaultOptions = { count: 4, ratio: "3:4", model: "Frame 1.0" };
