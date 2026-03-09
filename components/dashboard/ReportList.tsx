import { ReportCard } from "@/components/dashboard/ReportCard";
import type { ReportStatus } from "@/lib/types/report";

interface ReportListItem {
  id: string;
  companyName: string;
  sector: string;
  status: string;
  createdAt: Date;
}

interface ReportListProps {
  reports: ReportListItem[];
}

export function ReportList({ reports }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 border rounded-xl bg-muted/30">
        <p className="font-medium">No reports yet</p>
        <p className="text-sm text-muted-foreground">
          Start a new analysis to create your first report.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Report History
      </h2>
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          id={report.id}
          companyName={report.companyName}
          sector={report.sector}
          status={report.status as ReportStatus}
          createdAt={report.createdAt}
        />
      ))}
    </div>
  );
}
