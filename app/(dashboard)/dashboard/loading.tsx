export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
        <div className="h-20 bg-muted rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
