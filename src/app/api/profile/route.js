import { demoProfile } from "../../../lib/server/demoProfile";
import { respond } from "../../../lib/server/http";

export function GET() {
  return respond(() => ({ profile: demoProfile }));
}
