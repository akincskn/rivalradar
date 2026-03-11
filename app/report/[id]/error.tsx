"use client";

export default function ReportError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">Failed to load the report.</p>
      <button
        onClick={reset}
        className="text-sm text-primary hover:underline"
      >
        Try again
      </button>
    </div>
  );
}
