"use client";

import { useEffect } from "react";

interface AutoRefreshProps {
  intervalMs?: number;
}

/**
 * Silently reloads the page after the given interval.
 * Used on processing reports so the user doesn't need to refresh manually.
 */
export function AutoRefresh({ intervalMs = 5000 }: AutoRefreshProps) {
  useEffect(() => {
    const timer = setTimeout(() => window.location.reload(), intervalMs);
    return () => clearTimeout(timer);
  }, [intervalMs]);

  return null;
}
