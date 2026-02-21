import { useQuery } from "@tanstack/react-query";
import { addressPool } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";

export default function AddressPool() {
  usePageTitle("Address Pool");
  const { data: stats } = useQuery({ queryKey: ["address-pool-stats"], queryFn: addressPool.stats });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Deposit Address Pool</h1>
        <Button size="sm"><Upload className="mr-1.5 h-3.5 w-3.5" />Upload CSV</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats?.map((s) => (
          <Card key={s.chain}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-mono uppercase">{s.chain}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-2xl font-bold">{s.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
                <div><p className="text-2xl font-bold">{s.allocated}</p><p className="text-xs text-muted-foreground">Allocated</p></div>
                <div><p className="text-2xl font-bold text-success">{s.available}</p><p className="text-xs text-muted-foreground">Available</p></div>
              </div>
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">No address pools configured</p>}
      </div>
    </div>
  );
}
