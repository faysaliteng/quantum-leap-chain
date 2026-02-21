import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { charges as chargesApi } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Download, ChevronLeft, ChevronRight } from "lucide-react";
import type { ChargeStatus, ListChargesParams } from "@/lib/types";

const STATUSES: ChargeStatus[] = ["NEW", "PENDING", "CONFIRMED", "PAID", "EXPIRED", "UNDERPAID", "OVERPAID"];

export default function ChargesList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ListChargesParams>({ page: 1, per_page: 25 });
  const [activeStatus, setActiveStatus] = useState<ChargeStatus | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["charges", filters, activeStatus],
    queryFn: () => chargesApi.list({ ...filters, status: activeStatus }),
  });

  const toggleStatus = (s: ChargeStatus) => {
    setActiveStatus((prev) => (prev === s ? undefined : s));
    setFilters((f) => ({ ...f, page: 1 }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Charges</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Export CSV</Button>
          <Button asChild size="sm"><Link to="/dashboard/charges/new"><PlusCircle className="mr-1.5 h-3.5 w-3.5" />New</Link></Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Button key={s} variant={activeStatus === s ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => toggleStatus(s)}>
            {s}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Asset</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2">Expires</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : data?.data?.length ? data.data.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/dashboard/charges/${c.id}`)}>
                    <td className="px-4 py-2 font-mono text-xs">{c.id.slice(0, 8)}</td>
                    <td className="px-4 py-2 max-w-[200px] truncate">{c.name}</td>
                    <td className="px-4 py-2 font-mono">{c.local_price?.amount ?? "—"}</td>
                    <td className="px-4 py-2 text-xs">{c.requested_crypto?.asset ?? "multi"}</td>
                    <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(c.expires_at).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No charges found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-xs text-muted-foreground">Page {data.page} of {data.total_pages}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={data.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={data.page >= data.total_pages} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
