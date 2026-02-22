import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/PageSkeleton";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileDown } from "lucide-react";
import { useExport } from "@/hooks/use-export";
import React from "react";

export default function AuditLog() {
  usePageTitle("Audit Log");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { startExport, isExporting } = useExport({ scope: "admin" });

  const { data, isLoading } = useQuery({ queryKey: ["audit-log", page, search], queryFn: () => admin.auditLog({ page, action: search || undefined }) });

  return (
    <div className="space-y-4" data-testid="page:admin-audit-log">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Audit Log</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => startExport("audit_logs", "csv", { action: search || undefined })} disabled={isExporting}>
            <FileDown className="mr-1.5 h-3.5 w-3.5" />{isExporting ? "Exporting…" : "Export"}
          </Button>
          <Input className="max-w-xs h-8 text-sm" placeholder="Filter by action…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} maxLength={100} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <TableSkeleton rows={10} cols={6} /> : (
            <>
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Time</th><th className="px-4 py-2">Actor</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Resource</th><th className="px-4 py-2">IP</th><th className="px-4 py-2 w-8"></th></tr></thead>
                <tbody>
                  {data?.data?.length ? data.data.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <tr className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                        <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2 text-xs">{entry.actor_email ?? entry.actor_id.slice(0, 8)}</td>
                        <td className="px-4 py-2"><Badge variant="outline" className="text-xs font-mono">{entry.action}</Badge></td>
                        <td className="px-4 py-2 text-xs font-mono">{entry.resource_type}/{entry.resource_id.slice(0, 8)}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground font-mono">{entry.ip_address ?? "—"}</td>
                        <td className="px-4 py-2">{expandedId === entry.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</td>
                      </tr>
                      {expandedId === entry.id && entry.details && (
                        <tr><td colSpan={6} className="px-4 py-2 bg-muted/30"><pre className="text-xs font-mono whitespace-pre-wrap max-h-40 overflow-auto">{JSON.stringify(entry.details, null, 2)}</pre></td></tr>
                      )}
                    </React.Fragment>
                  )) : <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No audit log entries</td></tr>}
                </tbody>
              </table>
              {data && data.total_pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-2">
                  <span className="text-xs text-muted-foreground">Page {data.page} / {data.total_pages}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
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
