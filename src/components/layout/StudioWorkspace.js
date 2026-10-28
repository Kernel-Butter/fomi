"use client";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "./AppShell";
import Header from "./Header";
import StudioErrorBoundary from "../ui/StudioErrorBoundary";
import { StudioNavigationContext } from "./StudioNavigation";
import { StudioBackendContext } from "./StudioBackend";
import {
  getConfig,
  startSession,
  getSettings,
  getProfile,
} from "../../lib/api";

export default function StudioWorkspace({ children }) {
  const pathname = usePathname();
  const segment = useSelectedLayoutSegment();
  const previewOpen = pathname.startsWith("/media/");
  const handlers = useRef(new Map());
  const [backend, setBackend] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    const expired = () => setSessionExpired(true);
    window.addEventListener("studio-session-expired", expired);
    return () => window.removeEventListener("studio-session-expired", expired);
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    getProfile(abort.signal)
      .then((data) => setProfile(data.profile))
      .catch(() => {});
    return () => abort.abort();
  }, []);
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
        <Header
          profile={profile}
          application={backend?.config.application}
          features={backend?.config.features}
        />
      </div>
      <div className="studio-workspace" hidden={!inStudio}>
        {sessionExpired && (
          <div className="session-error" role="alert">
            <p>
              Your session expired. Copy any unsent prompt before starting a new
              session.
            </p>
            <button type="button" onClick={() => window.location.reload()}>
              Start new session
            </button>
          </div>
        )}
        {backend ? (
          <StudioBackendContext.Provider value={backend}>
            {["image", "video"].map((type) => {
              const visible = segment === `${type}studio`;
              const active = visible && !previewOpen;
              return (
                <div
                  key={type}
                  className="studio-session"
                  hidden={!visible || !backend.config.features[type]}
                >
                  <StudioErrorBoundary>
                    <AppShell type={type} active={active} />
                  </StudioErrorBoundary>
                </div>
              );
            })}
            {inStudio &&
              !backend.config.features[
                segment === "imagestudio" ? "image" : "video"
              ] && (
                <main className="not-found">
                  <h1>This studio is currently unavailable</h1>
                  <p>Please choose another studio from the header.</p>
                </main>
              )}
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
