import * as defaults from "./generationConfig";
import { imagePromptCards, videoPromptCards } from "./promptPresets";
import {
  isValidGenerationOptions,
  isValidStudioSettings,
} from "./generationValidation";

const object = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.length > 0;
const positive = (value) => Number.isFinite(value) && value > 0;
function matches(value, template) {
  if (Array.isArray(template))
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((entry) => matches(entry, template[0]))
    );
  if (object(template))
    return (
      object(value) &&
      Object.entries(template).every(([key, sample]) =>
        matches(value[key], sample),
      )
    );
  return (
    typeof value === typeof template &&
    (typeof value !== "number" || Number.isFinite(value))
  );
}
function media(item) {
  return (
    object(item) &&
    text(item.id) &&
    ["image", "video"].includes(item.type) &&
    typeof item.prompt === "string" &&
    text(item.model) &&
    positive(item.width) &&
    positive(item.height) &&
    typeof item.src === "string" &&
    item.src.startsWith("/") &&
    !item.src.startsWith("//") &&
    (!item.poster ||
      (typeof item.poster === "string" &&
        item.poster.startsWith("/") &&
        !item.poster.startsWith("//"))) &&
    (!item.presentation || object(item.presentation))
  );
}
function job(value) {
  return (
    object(value) &&
    text(value.id) &&
    typeof value.prompt === "string" &&
    Number.isFinite(value.createdAt) &&
    isValidGenerationOptions(value) &&
    ["queued", "processing", "completed", "failed"].includes(value.status) &&
    value.loading === ["queued", "processing"].includes(value.status) &&
    Number.isFinite(value.progress) &&
    value.progress >= 0 &&
    value.progress <= 100 &&
    typeof value.error === "string" &&
    Array.isArray(value.items) &&
    value.items.every(media) &&
    (value.status !== "completed" || value.items.length === value.count)
  );
}
export function validResponse(path, data) {
  const [pathname, query] = path.split("?");
  if (pathname === "/api/config") {
    const template = {
      ...defaults,
      promptCards: { image: imagePromptCards, video: videoPromptCards },
      pollingInterval: 300,
    };
    return (
      matches(data, template) &&
      data.pollingInterval >= 100 &&
      data.pollingInterval <= 30000 &&
      ["image", "video"].every(
        (type) =>
          !data.features[type] ||
          data.models.some(
            (model) =>
              model.types.includes(type) &&
              model.id === data.defaultOptions.model,
          ),
      )
    );
  }
  if (pathname === "/api/sessions")
    return text(data.id) && positive(data.expiresAt);
  if (pathname === "/api/settings")
    return isValidStudioSettings(
      data.settings,
      new URLSearchParams(query).get("type"),
    );
  if (pathname === "/api/generate" || pathname.startsWith("/api/jobs/"))
    return job(data.job);
  if (pathname === "/api/history")
    return Array.isArray(data.history) && data.history.every(job);
  if (pathname.startsWith("/api/history/")) return job(data.group);
  if (pathname.startsWith("/api/media/"))
    return (
      media(data.item) &&
      object(data.navigation) &&
      Number.isInteger(data.navigation.index) &&
      Number.isInteger(data.navigation.total) &&
      data.navigation.index > 0 &&
      data.navigation.index <= data.navigation.total &&
      [data.navigation.previous, data.navigation.next].every(
        (id) => id === null || text(id),
      )
    );
  if (pathname === "/api/profile")
    return (
      object(data.profile) &&
      ["displayName", "avatarUrl", "avatarAlt"].every((key) =>
        text(data.profile[key]),
      )
    );
  return true;
}
