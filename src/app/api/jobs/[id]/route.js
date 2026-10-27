import { getSession } from "../../../../lib/server/store";
import { respond } from "../../../../lib/server/http";
import { readJob } from "../../../../lib/server/service";

export function GET(request, context) {
  return respond(async () => ({
    job: readJob(getSession(request), (await context.params).id),
  }));
}
