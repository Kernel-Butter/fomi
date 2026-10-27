"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

export const RouteNavigationContext = createContext(null);
const ProgressContext = createContext(false);

export function RouteProgress() {
  const pending = useContext(ProgressContext);
  return (
    <div
      className={`route-progress ${pending ? "is-loading" : ""}`}
      aria-hidden="true"
    >
      <span />
    </div>
  );
}

export default function RouteProgressProvider({ children }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const push = useCallback(
    (href, options) => startTransition(() => router.push(href, options)),
    [router],
  );
  const replace = useCallback(
    (href, options) => startTransition(() => router.replace(href, options)),
    [router],
  );
  const back = useCallback(
    () => startTransition(() => router.back()),
    [router],
  );
  const navigation = useMemo(
    () => ({ push, replace, back }),
    [push, replace, back],
  );
  return (
    <RouteNavigationContext.Provider value={navigation}>
      <ProgressContext.Provider value={pending}>
        <RouteProgress />
        {children}
      </ProgressContext.Provider>
    </RouteNavigationContext.Provider>
  );
}
