"use client";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "./AppShell";
import Header from "./Header";
import { StudioNavigationContext } from "./StudioNavigation";
import { StudioBackendContext } from "./StudioBackend";
import { getConfig, startSession, getSettings } from "../../lib/api";

export default function StudioWorkspace({ children }) {
  const pathname = usePathname();
  const segment = useSelectedLayoutSegment();
  const previewOpen = pathname.startsWith("/media/");
  const handlers = useRef(new Map());
  const [backend, setBackend] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    async function initialize() {
      try {
        const [config, session] = await Promise.all([
          getConfig(abort.signal),
          startSession(abort.signal),
        ]);
        const [image, video] = await Promise.all(
          ["image", "video"].map((type) =>
            getSettings(session.id, type, abort.signal),
          ),
        );
        setBackend({
          config,
          sessionId: session.id,
          initialSettings: { image: image.settings, video: video.settings },
        });
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(requestError.message);
      }
    }
    initialize();
    return () => abort.abort();
  }, [attempt]);
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
  const inStudio = ["imagestudio", "videostudio"].includes(segment);
  return (
    <StudioNavigationContext.Provider value={navigation}>
      <div className="app-shell header-shell">
        <Header />
      </div>
      <div className="studio-workspace" hidden={!inStudio}>
        {backend ? (
          <StudioBackendContext.Provider value={backend}>
            {["image", "video"].map((type) => {
              const visible = segment === `${type}studio`;
              const active = visible && !previewOpen;
              return (
                <div key={type} className="studio-session" hidden={!visible}>
                  <AppShell type={type} active={active} />
                </div>
              );
            })}
          </StudioBackendContext.Provider>
        ) : (
          <div
            className="studio-initializing"
            role={error ? "alert" : "status"}
            aria-label={
              error ? "Studio connection error" : "Studio connection status"
            }
          >
            {error ? (
              <>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setAttempt((value) => value + 1);
                  }}
                >
                  Try again
                </button>
              </>
            ) : (
              <>
                <span className="spinner" />
                <p>Opening your studio…</p>
              </>
            )}
          </div>
        )}
      </div>
      {children}
    </StudioNavigationContext.Provider>
  );
}
