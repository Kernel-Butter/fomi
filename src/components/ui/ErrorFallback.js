"use client";
export default function ErrorFallback({ onRetry, global = false }) {
  return (
    <main
      className="app-error"
      role="alert"
      style={{
        margin: "auto",
        padding: 32,
        maxWidth: 520,
        fontFamily: "sans-serif",
        color: "#403630",
      }}
    >
      <h1>Something went wrong</h1>
      <p>We couldn’t display this screen. Try again to recover.</p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: "12px 20px",
          borderRadius: 24,
          background: "#e59d88",
          border: 0,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
      {global && (
        <p>Reloading starts a new session. Copy any unsent work first.</p>
      )}
    </main>
  );
}
