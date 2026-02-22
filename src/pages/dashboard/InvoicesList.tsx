import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoices } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText, PlusCircle, Search, Send, Eye, Download, Trash2,
  DollarSign, Clock, CheckCircle, XCircle, Receipt,
} from "lucide-react";
import type { InvoiceStatus } from "@/lib/types";

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  viewed: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default function InvoicesList() {
  usePageTitle("Invoices");
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", statusFilter],
    queryFn: () => invoices.list({ status: statusFilter === "all" ? undefined : statusFilter }),
  });

  const sendMut = useMutation({
    mutationFn: (id: string) => invoices.send(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice sent"); },
    onError: () => toast.error("Failed to send"),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => invoices.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice cancelled"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => invoices.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Deleted"); },
  });

  if (isLoading) return <PageSkeleton />;

  const allInvoices = data?.data ?? [];
  const filtered = allInvoices.filter((inv) =>
    !search || inv.customer_name.toLowerCase().includes(search.toLowerCase()) || inv.number.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = allInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + parseFloat(i.total), 0);
  const pendingAmount = allInvoices.filter((i) => i.status === "sent" || i.status === "viewed").reduce((s, i) => s + parseFloat(i.total), 0);

  return (
    <div className="space-y-6" data-testid="page:invoices-list">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Invoices</h1>
        <Button asChild>
          <Link to="/dashboard/invoices/new"><PlusCircle className="mr-1.5 h-3.5 w-3.5" />Create Invoice</Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Invoices" value={allInvoices.length} icon={FileText} />
        <StatCard label="Paid Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Pending" value={`$${pendingAmount.toLocaleString()}`} icon={Clock} />
        <StatCard label="Overdue" value={allInvoices.filter((i) => i.status === "overdue").length} icon={XCircle} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? filtered.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link to={`/dashboard/invoices/${inv.id}`} className="font-mono text-xs text-primary hover:underline font-medium">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{inv.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{inv.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">${parseFloat(inv.total).toLocaleString()} <span className="text-muted-foreground font-normal">{inv.currency}</span></td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusStyles[inv.status]} border-0 text-xs capitalize`}>{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {inv.status === "draft" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => sendMut.mutate(inv.id)} title="Send">
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="View">
                          <Link to={`/dashboard/invoices/${inv.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                        </Button>
                        {(inv.status === "draft" || inv.status === "cancelled") && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(inv.id)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No invoices yet. <Link to="/dashboard/invoices/new" className="text-primary hover:underline">Create your first invoice</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
