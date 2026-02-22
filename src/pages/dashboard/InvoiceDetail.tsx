import { useParams, useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoices } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/PageSkeleton";
import { CopyButton } from "@/components/CopyButton";
import { toast } from "sonner";
import {
  ArrowLeft, Send, Download, XCircle, Copy, ExternalLink,
  Calendar, Mail, User, FileText, CreditCard,
} from "lucide-react";
import type { InvoiceStatus } from "@/lib/types";

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  viewed: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};

const chainLabels: Record<string, string> = {
  btc: "Bitcoin", eth: "Ethereum", arbitrum: "Arbitrum", optimism: "Optimism", polygon: "Polygon",
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  usePageTitle(t("invoiceDetail.title"));
  const qc = useQueryClient();

  const { data: inv, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoices.get(id!),
    enabled: !!id,
  });

  const sendMut = useMutation({
    mutationFn: () => invoices.send(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoice", id] }); toast.success("Invoice sent to customer"); },
    onError: () => toast.error("Failed to send"),
  });

  const cancelMut = useMutation({
    mutationFn: () => invoices.cancel(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoice", id] }); toast.success("Invoice cancelled"); },
  });

  const handleDownloadPdf = async () => {
    try {
      const blob = await invoices.downloadPdf(id!);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${inv?.number ?? id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF download failed");
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (!inv) return <div className="text-center py-16 text-muted-foreground">{t("invoiceDetail.notFound")}</div>;

  return (
    <div className="space-y-6 max-w-3xl" data-testid="page:dashboard-invoice-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              {t("invoices.invoice")} {inv.number}
              <Badge className={`${statusStyles[inv.status]} border-0 text-xs capitalize`}>{inv.status}</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">Created {new Date(inv.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {inv.status === "draft" && (
            <Button size="sm" onClick={() => sendMut.mutate()} disabled={sendMut.isPending}>
              <Send className="mr-1.5 h-3.5 w-3.5" />{t("invoiceDetail.send")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="mr-1.5 h-3.5 w-3.5" />PDF
          </Button>
          {inv.status !== "paid" && inv.status !== "cancelled" && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => cancelMut.mutate()}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />{t("invoiceDetail.cancel")}
            </Button>
          )}
        </div>
      </div>

      {/* Customer + Payment Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" />{t("invoiceDetail.customer")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{inv.customer_name}</p>
            <p className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{inv.customer_email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" />{t("invoiceDetail.payment")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("table.dueDate")}</span><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(inv.due_date).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("invoiceDetail.chains")}</span><span>{inv.chains.map((c) => chainLabels[c] ?? c).join(", ")}</span></div>
            {inv.payment_url && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded">
                <code className="text-xs font-mono truncate flex-1">{inv.payment_url}</code>
                <CopyButton value={inv.payment_url} />
              </div>
            )}
            {inv.paid_at && <div className="flex justify-between text-success"><span>Paid</span><span>{new Date(inv.paid_at).toLocaleString()}</span></div>}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />{t("invoiceDetail.items")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-2">{t("table.description")}</th>
                <th className="px-4 py-2 text-right">{t("table.qty")}</th>
                <th className="px-4 py-2 text-right">{t("table.unitPrice")}</th>
                <th className="px-4 py-2 text-right">{t("table.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">${parseFloat(item.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("invoiceDetail.subtotal")}</span><span className="font-mono">${parseFloat(inv.subtotal).toFixed(2)}</span></div>
            {inv.tax_rate > 0 && (
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("createInvoice.tax")} ({inv.tax_rate}%)</span><span className="font-mono">${parseFloat(inv.tax_amount).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>{t("invoiceDetail.total")}</span><span className="font-mono font-display">${parseFloat(inv.total).toFixed(2)} {inv.currency}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {inv.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("invoiceDetail.notes")}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inv.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-sm">{t("invoiceDetail.timeline")}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">{t("invoiceDetail.created")}</span>
              <span className="text-xs ml-auto">{new Date(inv.created_at).toLocaleString()}</span>
            </div>
            {inv.sent_at && (
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-info" />
                <span className="text-muted-foreground">{t("invoiceDetail.sentToCustomer")}</span>
                <span className="text-xs ml-auto">{new Date(inv.sent_at).toLocaleString()}</span>
              </div>
            )}
            {inv.viewed_at && (
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-muted-foreground">{t("invoiceDetail.viewedByCustomer")}</span>
                <span className="text-xs ml-auto">{new Date(inv.viewed_at).toLocaleString()}</span>
              </div>
            )}
            {inv.paid_at && (
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-success font-medium">{t("invoiceDetail.paymentReceived")}</span>
                <span className="text-xs ml-auto">{new Date(inv.paid_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
