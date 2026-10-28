import { ServiceError } from "./store.js";
import { withJsonStore } from "./store.js";

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new ServiceError(400, "Send a valid JSON request.");
  }
}
export async function respond(action) {
  try {
    const result = await withJsonStore(action);
    return Response.json(result.data ?? result, {
      status: result.status ?? 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (!(error instanceof ServiceError))
      console.error("Demo API error:", error);
    return Response.json(
      {
        error:
          error instanceof ServiceError
            ? error.message
            : "Something went wrong. Please try again.",
      },
      {
        status: error instanceof ServiceError ? error.status : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
