import { createSession } from "../../../lib/server/store";
import { respond } from "../../../lib/server/http";

export function POST() {
  return respond(() => ({ data: createSession(), status: 201 }));
}
