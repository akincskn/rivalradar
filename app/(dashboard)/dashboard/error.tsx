"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * NEDEN "use client": error.tsx zorunlu olarak Client Component olmalı.
 * Next.js'in Suspense error boundary'si sadece client-side çalışır.
 */
export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          An unexpected error occurred while loading the dashboard. Please try again.
        </p>
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );
}
