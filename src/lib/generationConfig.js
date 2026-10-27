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
    { name: "Natural", image: 7, detail: "True-to-life light and texture" },
    { name: "Cinematic", image: 9, detail: "Atmospheric depth and contrast" },
    { name: "Analog", image: 10, detail: "Warm grain and nostalgic tones" },
    { name: "Editorial", image: 1, detail: "Clean composition and detail" },
    {
      name: "Dreamscape",
      image: 9,
      detail: "Luminous worlds and imaginative detail",
    },
    {
      name: "Minimal",
      image: 6,
      detail: "Quiet forms and uncluttered composition",
    },
  ],
  Colors: [
    {
      name: "Original",
      image: 5,
      detail: "Keep the scene’s natural colors",
      colors: ["#a7c5bf", "#318f8c", "#497a51", "#d7c8a9"],
    },
    {
      name: "Ocean Mist",
      image: 6,
      detail: "Cool, quiet, and softly muted",
      colors: ["#174a58", "#52828c", "#acc3c1", "#dee2d7"],
    },
    {
      name: "Golden Hour",
      image: 10,
      detail: "Sunlit amber and warm shadows",
      colors: ["#bd6d43", "#ecae71", "#f6d6a6", "#594d41"],
    },
    {
      name: "Soft Pastel",
      image: 9,
      detail: "Airy pinks and gentle lavender",
      colors: ["#b2becf", "#ddc0d2", "#b7a6c6", "#e9e0e3"],
    },
  ],
  Camera: [
    { name: "Auto", image: 12, detail: "A balanced view of the scene" },
    { name: "Close-up", image: 1, detail: "Intimate framing and fine detail" },
    {
      name: "Wide Angle",
      image: 5,
      detail: "Open landscapes and a sense of scale",
    },
    {
      name: "Low Angle",
      image: 7,
      detail: "A bold perspective looking upward",
    },
  ],
};

export const styles = references.Styles.map((reference) => reference.name);
export const counts = [1, 2, 3, 4];
export const ratios = ["1:1", "3:4", "16:9"];
export const models = ["Frame 1.0", "Flux", "Studio"];
export const samplingSteps = [16, 24, 28, 36, 50];
