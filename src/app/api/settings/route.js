import { getSession, getType } from "../../../lib/server/store";
import { readJson, respond } from "../../../lib/server/http";
import { saveSettings, resetSettings } from "../../../lib/server/service";

export function GET(request) {
  return respond(() => ({
    settings: getSession(request).settings[getType(request)],
  }));
}
export function PUT(request) {
  return respond(async () => ({
    settings: saveSettings(
      getSession(request),
      getType(request),
      await readJson(request),
    ),
  }));
}
export function DELETE(request) {
  return respond(() => ({
    settings: resetSettings(getSession(request), getType(request)),
  }));
}
