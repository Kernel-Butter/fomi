import { getSession } from "../../../lib/server/store";
import { readJson, respond } from "../../../lib/server/http";
import { submitJob } from "../../../lib/server/service";
import { isValidGenerationRequest } from "../../../lib/generationValidation";
import { ServiceError } from "../../../lib/server/store";

export function POST(request) {
  return respond(async () => {
    const data = await readJson(request);
    if (!isValidGenerationRequest(data))
      throw new ServiceError(400, "Please check your generation options.");
    return {
      data: {
        job: submitJob(
          getSession(request),
          data,
          request.headers.get("x-mock-failure") === "once",
        ),
      },
      status: 202,
    };
  });
}
