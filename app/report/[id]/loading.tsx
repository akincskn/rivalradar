export default function ReportLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 bg-muted rounded-xl" />
          <div className="h-40 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}
