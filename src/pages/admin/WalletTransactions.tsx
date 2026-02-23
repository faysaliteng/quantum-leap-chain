import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { adminWalletTransactions } from "@/lib/api-extended";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { CopyButton } from "@/components/CopyButton";
import {
  ArrowUpRight, ArrowDownLeft, ArrowRightLeft, ExternalLink, Clock,
  Filter, Search, Wallet, CheckCircle, Loader2, XCircle, FileSignature, Shield, FileDown,
} from "lucide-react";
import { useExport } from "@/hooks/use-export";
import type { WalletTxDirection, WalletTxStatus } from "@/lib/types-extended";

const directionConfig: Record<WalletTxDirection, { icon: React.ReactNode; label: string; color: string }> = {
  send: { icon: <ArrowUpRight className="h-4 w-4" />, label: "Send", color: "text-destructive" },
  receive: { icon: <ArrowDownLeft className="h-4 w-4" />, label: "Receive", color: "text-success" },
  withdraw: { icon: <ArrowRightLeft className="h-4 w-4" />, label: "Withdraw", color: "text-warning" },
  swap: { icon: <ArrowRightLeft className="h-4 w-4" />, label: "Swap", color: "text-primary" },
};

const statusConfig: Record<WalletTxStatus, { icon: React.ReactNode; color: string }> = {
  drafted: { icon: <FileSignature className="h-3.5 w-3.5" />, color: "bg-muted text-muted-foreground" },
  pending: { icon: <Clock className="h-3.5 w-3.5" />, color: "bg-warning/10 text-warning" },
  pending_signature: { icon: <Clock className="h-3.5 w-3.5" />, color: "bg-warning/10 text-warning" },
  signed: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: "bg-info/10 text-info" },
  broadcasted: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, color: "bg-info/10 text-info" },
  confirmed: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: "bg-success/10 text-success" },
  failed: { icon: <XCircle className="h-3.5 w-3.5" />, color: "bg-destructive/10 text-destructive" },
  cancelled: { icon: <XCircle className="h-3.5 w-3.5" />, color: "bg-muted text-muted-foreground" },
};

export default function AdminWalletTransactions() {
  const { t } = useI18n();
  usePageTitle(t("admin.walletAudit"));
  const [filterDir, setFilterDir] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { startExport, isExporting } = useExport({ scope: "admin" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-wallet-tx", filterDir, filterStatus],
    queryFn: () => adminWalletTransactions.list({
      direction: filterDir !== "all" ? filterDir : undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
      per_page: 50,
    }),
  });

  if (isLoading) return <PageSkeleton />;

  const txs = data?.data ?? [];
  const filtered = search
    ? txs.filter((t) => t.tx_hash?.includes(search) || t.to_address.includes(search) || t.memo?.toLowerCase().includes(search.toLowerCase()))
    : txs;

  return (
    <div className="space-y-6" data-testid="page:admin-wallet-transactions">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />{t("admin.walletAudit")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("admin.walletAuditDesc")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => startExport("wallet_transactions", "csv", { direction: filterDir !== "all" ? filterDir : undefined, status: filterStatus !== "all" ? filterStatus : undefined })} disabled={isExporting}>
          <FileDown className="mr-1.5 h-3.5 w-3.5" />{isExporting ? t("charges.exporting") : t("common.export")}
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterDir} onValueChange={setFilterDir}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.allDirections")}</SelectItem>
            <SelectItem value="send">{t("txHistory.send")}</SelectItem>
            <SelectItem value="receive">{t("txHistory.receive")}</SelectItem>
            <SelectItem value="withdraw">{t("txHistory.withdraw")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.allStatuses")}</SelectItem>
            <SelectItem value="confirmed">{t("txHistory.confirmed")}</SelectItem>
            <SelectItem value="broadcasted">{t("txHistory.broadcasted")}</SelectItem>
            <SelectItem value="pending_signature">{t("txHistory.pendingSignature")}</SelectItem>
            <SelectItem value="failed">{t("txHistory.failed")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("admin.searchHashAddress")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("admin.noWalletTx")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const dir = directionConfig[tx.direction];
            const stat = statusConfig[tx.status];
            return (
              <Card key={tx.id} className="hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${dir.color}`}>{dir.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-semibold text-sm ${dir.color}`}>{dir.label}</span>
                        <span className="font-bold text-sm">{tx.amount} {tx.asset}</span>
                        {tx.fee && <span className="text-xs text-muted-foreground">(fee: {tx.fee})</span>}
                        <Badge className={`${stat.color} border-0 text-xs gap-1`}>{stat.icon}{tx.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>To:</span>
                        <code className="font-mono truncate max-w-[200px]">{tx.to_address}</code>
                        <CopyButton value={tx.to_address} />
                      </div>
                      {tx.tx_hash && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>Tx:</span>
                          <code className="font-mono truncate max-w-[200px]">{tx.tx_hash}</code>
                          <CopyButton value={tx.tx_hash} />
                          {tx.explorer_url && (
                            <a href={tx.explorer_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"><ExternalLink className="h-3 w-3" /></a>
                          )}
                        </div>
                      )}
                      {tx.memo && <p className="text-xs text-muted-foreground mt-1 italic">Memo: {tx.memo}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{new Date(tx.created_at).toLocaleString()}</span>
                        <Badge variant="outline" className="text-[10px]">{tx.chain}</Badge>
                        {tx.created_by && <span>{t("admin.createdBy")}: {tx.created_by}</span>}
                        {tx.approved_by && <span className="text-success">{t("admin.approvedBy")}: {tx.approved_by}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}