"use client";
import { memo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "../navigation/AppLink";
import Icon from "../Icon";

function ResultCard({ item, index, priority, active }) {
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [requested, setRequested] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [thumbnailAttempt, setThumbnailAttempt] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    if (active && requested && !document.hidden) {
      video.play().catch(() => {
        if (!cancelled) setRequested(false);
      });
    } else {
      video.pause();
      setRequested(false);
    }
    return () => {
      cancelled = true;
      video.pause();
    };
  }, [active, requested, started]);

  useEffect(() => {
    if (item.type !== "video") return;
    function onVisibilityChange() {
      if (document.hidden) {
        videoRef.current?.pause();
        setRequested(false);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [item.type]);

  function play() {
    if (active && !failed) {
      setStarted(true);
      setRequested(true);
    }
  }
  function pause() {
    setRequested(false);
  }
  return (
    <div
      className="result-card"
      style={{
        aspectRatio: `${item.width} / ${item.height}`,
        animationDelay: `${index * 90}ms`,
      }}
      onPointerEnter={
        item.type === "video"
          ? (event) => {
              if (event.pointerType === "mouse") play();
            }
          : undefined
      }
      onPointerLeave={item.type === "video" ? pause : undefined}
    >
      <Image
        key={thumbnailAttempt}
        src={item.poster || item.src}
        fill
        sizes="(min-width: 900px) and (max-width: 1023px) and (orientation: landscape) 31vw, (max-width: 639px) 46vw, (max-width: 1023px) 46vw, (max-width: 1536px) 18vw, 260px"
        style={item.presentation}
        alt={item.prompt}
        priority={priority}
        onError={() => setThumbnailFailed(true)}
        onLoad={() => setThumbnailFailed(false)}
      />
      {thumbnailFailed && (
        <div className="result-media-error" role="alert">
          <span>Preview image unavailable</span>
          <button
            type="button"
            onClick={() => {
              setThumbnailFailed(false);
              setThumbnailAttempt((value) => value + 1);
            }}
          >
            Retry image
          </button>
        </div>
      )}
      <Link
        className="result-preview-link"
        prefetch={false}
        href={`/media/${encodeURIComponent(item.id)}`}
        scroll={false}
        onClick={pause}
        aria-label={`Open ${item.type} preview`}
      >
        <span className="result-expand" aria-hidden="true">
          <Icon name="expand" size={16} />
        </span>
      </Link>
      {item.type === "video" && (
        <>
          {started && (
            <video
              ref={videoRef}
              src={item.src}
              poster={item.poster}
              style={item.presentation}
              muted
              loop
              playsInline
              preload="none"
              aria-label={item.prompt}
              onPlaying={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={() => {
                setFailed(true);
                setRequested(false);
                setPlaying(false);
              }}
            />
          )}
          <button
            type="button"
            className="video-play"
            aria-label={playing ? "Pause video" : "Play video"}
            aria-pressed={playing}
            disabled={failed}
            onClick={() => {
              if (requested) pause();
              else play();
            }}
          >
            <Icon name={playing ? "video" : "play"} size={20} />
          </button>
          {failed && (
            <span className="video-error" role="alert">
              Video unavailable{" "}
              <button
                type="button"
                onClick={() => {
                  setFailed(false);
                  setStarted(false);
                }}
              >
                Retry video
              </button>
            </span>
          )}
        </>
      )}
    </div>
  );
}
export default memo(ResultCard);
