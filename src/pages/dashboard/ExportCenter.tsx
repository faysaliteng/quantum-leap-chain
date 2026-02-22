import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exports as exportsApi } from "@/lib/api-extended";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import {
  Download, FileSpreadsheet, Clock, CheckCircle, XCircle, Loader2, RefreshCw, Plus,
} from "lucide-react";
import type { DataExportJob, ExportKind, ExportStatus } from "@/lib/types-extended";

const MERCHANT_KINDS: { value: ExportKind; label: string }[] = [
  { value: "charges", label: "Charges" },
  { value: "invoices", label: "Invoices" },
  { value: "wallet_transactions", label: "Wallet Transactions" },
  { value: "webhook_deliveries", label: "Webhook Deliveries" },
];

const statusConfig: Record<ExportStatus, { icon: React.ReactNode; color: string }> = {
  queued: { icon: <Clock className="h-3.5 w-3.5" />, color: "bg-muted text-muted-foreground" },
  running: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, color: "bg-info/10 text-info" },
  completed: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: "bg-success/10 text-success" },
  failed: { icon: <XCircle className="h-3.5 w-3.5" />, color: "bg-destructive/10 text-destructive" },
};

export default function ExportCenter() {
  const { t } = useI18n();
  usePageTitle(t("exports.title"));
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [kind, setKind] = useState<ExportKind>("charges");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["exports"],
    queryFn: () => exportsApi.list(),
    refetchInterval: 5000,
  });

  const createMut = useMutation({
    mutationFn: () => exportsApi.create({
      kind,
      format,
      filters: {
        ...(dateFrom ? { from: dateFrom } : {}),
        ...(dateTo ? { to: dateTo } : {}),
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exports"] });
      setShowCreate(false);
      toast.success("Export job created");
    },
    onError: () => toast.error("Failed to create export"),
  });

  const handleDownload = (job: DataExportJob) => {
    window.open(exportsApi.downloadUrl(job.id), "_blank");
  };

  if (isLoading) return <PageSkeleton />;

  const jobs = data?.data ?? [];

  return (
    <div className="space-y-6" data-testid="page:dashboard-exports">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">{t("exports.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("exports.subtitle") || "Export your data as CSV or JSON files"}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />{t("exports.newExport") || "New Export"}
        </Button>
      </div>

      {/* Export Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground text-sm">No exports yet. Create your first export to download your data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const stat = statusConfig[job.status];
            return (
              <Card key={job.id} className="hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileSpreadsheet className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm capitalize">{job.kind.replace("_", " ")}</span>
                          <Badge className={`${stat.color} border-0 text-xs gap-1`}>{stat.icon}{job.status}</Badge>
                          <Badge variant="outline" className="text-xs uppercase">{job.file_format}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{new Date(job.created_at).toLocaleString()}</span>
                          {job.size_bytes && <span>{(job.size_bytes / 1024).toFixed(1)} KB</span>}
                          {job.expires_at && <span>Expires: {new Date(job.expires_at).toLocaleDateString()}</span>}
                        </div>
                        {job.error_message && <p className="text-xs text-destructive mt-1">{job.error_message}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {job.status === "completed" && (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(job)}>
                          <Download className="mr-1.5 h-3.5 w-3.5" />Download
                        </Button>
                      )}
                      {job.status === "failed" && (
                        <Button variant="outline" size="sm" onClick={() => createMut.mutate()}>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Export Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("exports.createNew") || "Create New Export"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("exports.dataType") || "Data Type"}</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as ExportKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MERCHANT_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("exports.format") || "Format"}</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as "csv" | "json")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("reports.from")}</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("reports.to")}</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("common.cancel") || "Cancel"}</Button>
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? t("exports.creating") || "Creating…" : t("exports.createExport") || "Create Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
