"use client";
import ErrorFallback from "../components/ui/ErrorFallback";
export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <ErrorFallback global onRetry={() => window.location.reload()} />
      </body>
    </html>
  );
}
