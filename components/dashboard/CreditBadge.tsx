import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CreditBadgeProps {
  credits: number;
}

export function CreditBadge({ credits }: CreditBadgeProps) {
  const variant = credits === 0 ? "destructive" : credits <= 1 ? "secondary" : "default";

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium">Credits Remaining</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each report uses 1 credit
          </p>
        </div>
        <Badge variant={variant} className="text-base px-4 py-1.5">
          {credits} {credits === 1 ? "credit" : "credits"}
        </Badge>
      </CardContent>
    </Card>
  );
}
