"use client";
import { useEffect } from "react";
import ErrorFallback from "../components/ui/ErrorFallback";
export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("Page rendering failed", error);
  }, [error]);
  return <ErrorFallback onRetry={reset} />;
}
