import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-20" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      <div className="flex gap-4">{[...Array(cols)].map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}</div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">{[...Array(cols)].map((_, j) => <Skeleton key={j} className="h-8 flex-1" />)}</div>
      ))}
    </div>
  );
}
