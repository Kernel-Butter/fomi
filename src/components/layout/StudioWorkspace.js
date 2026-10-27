"use client";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";
import AppShell from "./AppShell";
import Header from "./Header";
import { StudioNavigationContext } from "./StudioNavigation";

// Shared layout owns the studios so route navigation does not discard their state.
export default function StudioWorkspace({ children }) {
  const pathname = usePathname();
  const handlers = useRef(new Map());
  const registerHistory = useCallback((type, handler) => {
    handlers.current.set(type, handler);
    return () => handlers.current.delete(type);
  }, []);
  const openHistory = useCallback(() => {
    const type =
      pathname === "/imagestudio"
        ? "image"
        : pathname === "/videostudio"
          ? "video"
          : null;
    handlers.current.get(type)?.();
  }, [pathname]);
  const navigation = useMemo(
    () => ({ registerHistory, openHistory }),
    [registerHistory, openHistory],
  );
  const inStudio = pathname === "/imagestudio" || pathname === "/videostudio";
  return (
    <StudioNavigationContext.Provider value={navigation}>
      <div className="app-shell header-shell">
        <Header />
      </div>
      <div className="studio-workspace" hidden={!inStudio}>
        {["image", "video"].map((type) => {
          const active = pathname === `/${type}studio`;
          return (
            <div key={type} className="studio-session" hidden={!active}>
              <AppShell type={type} active={active} />
            </div>
          );
        })}
      </div>
      {children}
    </StudioNavigationContext.Provider>
  );
}
