"use client";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Icon from "../Icon";
import CloseButton from "../ui/CloseButton";
import Link from "../navigation/AppLink";
import { RouteNavigationContext } from "../navigation/RouteProgressProvider";
import { usePathname } from "next/navigation";
import { getMedia } from "../../lib/api";

export default function MediaPreview({ id, modal = false }) {
  const router = useContext(RouteNavigationContext);
  const pathname = usePathname();
  const selectedId = pathname.startsWith("/media/")
    ? decodeURIComponent(pathname.slice(7))
    : id;
  const closeRef = useRef(null);
  const [navigation, setNavigation] = useState(null);
  const videoRef = useRef(null);
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const abort = new AbortController();
    setItem(null);
    setError("");
    getMedia(selectedId, abort.signal)
      .then((data) => {
        if (abort.signal.aborted) return;
        setItem(data.item);
        setNavigation(data.navigation);
        setError("");
      })
      .catch((requestError) => {
        if (!abort.signal.aborted && requestError.name !== "AbortError")
          setError(requestError.message);
      });
    return () => abort.abort();
  }, [selectedId, attempt]);

  useEffect(() => {
    if (modal) closeRef.current?.focus({ preventScroll: true });
  }, [selectedId, modal]);

  useEffect(() => {
    const video = videoRef.current;
    function pauseWhenHidden() {
      if (document.hidden) video?.pause();
    }
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      video?.pause();
      document.removeEventListener("visibilitychange", pauseWhenHidden);
    };
  }, [item]);

  function navigate(direction) {
    const target = navigation?.[direction];
    if (!target) return;
    const href = `/media/${encodeURIComponent(target)}`;
    if (modal) router.replace(href, { scroll: false });
    else window.history.replaceState(null, "", href);
  }
  function handleArrows(event) {
    if (
      !item ||
      item.type !== "image" ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest("input,textarea,select,video,[contenteditable=true]")
    )
      return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      navigate(event.key === "ArrowLeft" ? "previous" : "next");
    }
  }

  const content = (
    <>
      <header className="media-preview-header">
        <h1 id={modal ? "media-modal-title" : "media-page-title"}>
          {item?.type === "video" ? "Video preview" : "Image preview"}
        </h1>
        {modal ? (
          <CloseButton
            ref={closeRef}
            className="media-preview-close"
            aria-label="Close preview"
            onClick={close}
          />
        ) : (
          <Link
            className="media-preview-return"
            href={item?.type === "video" ? "/videostudio" : "/imagestudio"}
          >
            Back to studio
          </Link>
        )}
      </header>
      {!item && !error && (
        <div className="media-preview-loading" role="status">
          <span className="spinner" />
          Loading preview…
        </div>
      )}
      {error && (
        <div className="media-preview-error" role="alert">
          <p>{error}</p>
          <div>
            <button
              type="button"
              onClick={() => {
                setItem(null);
                setError("");
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </button>
            <Link href="/imagestudio">Back to Image Studio</Link>
          </div>
        </div>
      )}
      {item && !error && (
        <div className="media-preview-body">
          <div className="media-preview-stage">
            {item.type === "video" ? (
              <video
                ref={videoRef}
                src={item.src}
                poster={item.poster}
                style={item.presentation}
                controls
                autoPlay
                muted
                playsInline
                preload="metadata"
                aria-label={item.prompt}
                onError={() =>
                  setError("This video could not be loaded. Please try again.")
                }
              />
            ) : (
              <Image
                src={item.src}
                alt={item.prompt}
                fill
                sizes="(max-width: 639px) 94vw, 80vw"
                style={{ ...item.presentation, objectFit: "contain" }}
                priority
                onError={() =>
                  setError("This image could not be loaded. Please try again.")
                }
              />
            )}
          </div>
          <footer className="media-preview-details">
            {navigation?.total > 1 && (
              <div
                className="media-preview-navigation"
                role="group"
                aria-label="Preview navigation"
              >
                <button
                  type="button"
                  aria-label={`Previous ${item.type}`}
                  disabled={!navigation.previous}
                  onClick={() => navigate("previous")}
                >
                  <Icon name="previous" size={22} />
                </button>
                <span
                  role="status"
                  aria-label="Preview position"
                  aria-live="polite"
                >
                  {navigation.index} of {navigation.total}
                </span>
                <button
                  type="button"
                  aria-label={`Next ${item.type}`}
                  disabled={!navigation.next}
                  onClick={() => navigate("next")}
                >
                  <Icon name="next" size={22} />
                </button>
              </div>
            )}
            <p>{item.prompt}</p>
            <div>
              <span>{item.model}</span>
              <span>
                {item.width} × {item.height}
              </span>
              {item.seed && <span>Seed {item.seed}</span>}
            </div>
          </footer>
        </div>
      )}
    </>
  );

  return modal ? (
    <div className="media-preview-content" onKeyDown={handleArrows}>
      {content}
    </div>
  ) : (
    <main
      className="media-preview-page"
      aria-labelledby="media-page-title"
      onKeyDown={handleArrows}
    >
      {content}
    </main>
  );
}
