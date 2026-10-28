"use client";
import { useSyncExternalStore } from "react";
const query = "(width < 1024px)";
function subscribe(listener) {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function snapshot() {
  return window.matchMedia(query).matches;
}
export default function useCompactLayout() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
