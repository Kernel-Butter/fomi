import { makeItems } from "../../../lib/mockData";
import { isValidGenerationRequest } from "../../../lib/generationValidation";

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!isValidGenerationRequest(data)) {
    return Response.json(
      { error: "Please check your generation options." },
      { status: 400 },
    );
  }
  await new Promise((resolve) =>
    setTimeout(resolve, 1200 + Math.random() * 700),
  );
  return Response.json({ items: makeItems(data) });
}
