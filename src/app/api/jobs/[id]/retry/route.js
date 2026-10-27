import { getSession } from "../../../../../lib/server/store";
import { respond } from "../../../../../lib/server/http";
import { retryJob } from "../../../../../lib/server/service";

export function POST(request, context) {
  return respond(async () => ({
    data: { job: retryJob(getSession(request), (await context.params).id) },
    status: 202,
  }));
}
