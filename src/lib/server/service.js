export {
  saveSettings,
  resetSettings,
  readJob,
  submitJob,
  retryJob,
  readHistory,
} from "../generationService.js";
import { findPublicMedia, ServiceError } from "./store.js";
export function getPublicMedia(id) {
  const item = findPublicMedia(id);
  if (!item)
    throw new ServiceError(
      404,
      "This preview is no longer available. Return to the studio to generate new media.",
    );
  return item;
}
