import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportStatus } from "@/lib/types/report";

interface ReportCardProps {
  id: string;
  companyName: string;
  sector: string;
  status: ReportStatus;
  createdAt: Date;
}

const statusConfig: Record<
  ReportStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

export function ReportCard({
  id,
  companyName,
  sector,
  status,
  createdAt,
}: ReportCardProps) {
  const config = statusConfig[status];
  const isClickable = status === "completed";

  const content = (
    <Card className={isClickable ? "hover:bg-accent transition-colors cursor-pointer" : ""}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="space-y-1 min-w-0">
          <p className="font-medium truncate">{companyName}</p>
          <p className="text-sm text-muted-foreground">{sector}</p>
          <p className="text-xs text-muted-foreground">
            {createdAt.toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {status === "processing" && (
            <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardContent>
    </Card>
  );

  if (isClickable) {
    return <Link href={`/report/${id}`}>{content}</Link>;
  }

  return content;
}
