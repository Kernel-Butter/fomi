import { getSession, getType } from "../../../lib/server/store";
import { respond } from "../../../lib/server/http";
import { readHistory } from "../../../lib/server/service";

export function GET(request) {
  return respond(() => ({
    history: readHistory(getSession(request), getType(request)),
  }));
}
