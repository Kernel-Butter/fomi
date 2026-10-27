import { getSession, ServiceError } from "../../../../lib/server/store";
import { respond } from "../../../../lib/server/http";
import { readJob } from "../../../../lib/server/service";

export function GET(request, context) {
  return respond(async () => {
    const group = readJob(getSession(request), (await context.params).id);
    if (group.status !== "completed")
      throw new ServiceError(409, "This generation is not ready yet.");
    return { group };
  });
}
