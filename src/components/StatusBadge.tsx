import { Badge } from "@/components/ui/badge";
import type { ChargeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<ChargeStatus, string> = {
  NEW: "bg-muted text-muted-foreground",
  PENDING: "bg-warning/15 text-warning border-warning/30",
  CONFIRMED: "bg-info/15 text-info border-info/30",
  PAID: "bg-success/15 text-success border-success/30",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELED: "bg-muted text-muted-foreground",
  UNDERPAID: "bg-warning/15 text-warning border-warning/30",
  OVERPAID: "bg-info/15 text-info border-info/30",
};

export function StatusBadge({ status, className }: { status: ChargeStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-mono uppercase tracking-wider", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
