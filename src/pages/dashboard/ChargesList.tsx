import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { charges as chargesApi } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { SEOHead } from "@/components/SEOHead";
import { TableSkeleton } from "@/components/PageSkeleton";
import type { ChargeStatus, ListChargesParams, Charge } from "@/lib/types";

const STATUSES: ChargeStatus[] = ["NEW", "PENDING", "CONFIRMED", "PAID", "EXPIRED", "UNDERPAID", "OVERPAID"];

function exportCSV(data: Charge[]) {
  const headers = ["id", "name", "status", "amount", "currency", "asset", "created_at", "expires_at"];
  const rows = data.map((c) => [
    c.id, c.name, c.status,
    c.local_price?.amount ?? "", c.local_price?.currency ?? "",
    c.requested_crypto?.asset ?? "",
    c.created_at, c.expires_at,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `charges-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ChargesList() {
  usePageTitle("Charges");
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ListChargesParams>({ page: 1, per_page: 25 });
  const [activeStatus, setActiveStatus] = useState<ChargeStatus | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["charges", filters, activeStatus, dateFrom, dateTo],
    queryFn: () => chargesApi.list({
      ...filters,
      status: activeStatus,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
  });

  const toggleStatus = (s: ChargeStatus) => {
    setActiveStatus((prev) => (prev === s ? undefined : s));
    setFilters((f) => ({ ...f, page: 1 }));
  };

  const filteredData = data?.data?.filter((c) =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm)
  );

  return (
    <div className="space-y-4" data-testid="page:charges-list">
      <SEOHead title="Charges" noindex />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Charges</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => filteredData && exportCSV(filteredData)} disabled={!filteredData?.length}>
            <Download className="mr-1.5 h-3.5 w-3.5" />Export CSV
          </Button>
          <Button asChild size="sm"><Link to="/dashboard/charges/new"><PlusCircle className="mr-1.5 h-3.5 w-3.5" />New</Link></Button>
        </div>
      </div>

      {/* Search + Date Range */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm w-[140px]" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm w-[140px]" />
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Button key={s} variant={activeStatus === s ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => toggleStatus(s)}>
            {s}
          </Button>
        ))}
        {activeStatus && (
          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => setActiveStatus(undefined)}>
            Clear
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <TableSkeleton rows={8} cols={7} /> : (
            <>
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
                    {filteredData?.length ? filteredData.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/dashboard/charges/${c.id}`)}>
                        <td className="px-4 py-2 font-mono text-xs text-primary">{c.id.slice(0, 8)}</td>
                        <td className="px-4 py-2 max-w-[200px] truncate">{c.name}</td>
                        <td className="px-4 py-2 font-mono">{c.local_price?.amount ?? "—"}</td>
                        <td className="px-4 py-2 text-xs font-mono uppercase">{c.requested_crypto?.asset ?? "multi"}</td>
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
                  <span className="text-xs text-muted-foreground">Page {data.page} of {data.total_pages} · {data.total} total</span>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
