export async function generate(payload, signal) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Generation failed. Please try again.");
  return data.items;
}
