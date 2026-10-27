import { getPublicMedia } from "../../../../lib/server/service";
import { respond } from "../../../../lib/server/http";

export function GET(_request, context) {
  return respond(async () => getPublicMedia((await context.params).id));
}
