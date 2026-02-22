import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useMutation } from "@tanstack/react-query";
import { invoices } from "@/lib/api-client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PlusCircle, Trash2, ArrowLeft, Send, Save } from "lucide-react";
import type { ChainId } from "@/lib/types";

const chains: { id: ChainId; label: string }[] = [
  { id: "btc", label: "Bitcoin" },
  { id: "eth", label: "Ethereum" },
  { id: "arbitrum", label: "Arbitrum" },
  { id: "optimism", label: "Optimism" },
  { id: "polygon", label: "Polygon" },
];

interface LineItem {
  description: string;
  quantity: number;
  unit_price: string;
}

export default function CreateInvoice() {
  const { t } = useI18n();
  usePageTitle(t("createInvoice.title"));
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: "" }]);
  const [currency, setCurrency] = useState("USD");
  const [selectedChains, setSelectedChains] = useState<ChainId[]>(["eth"]);
  const [taxRate, setTaxRate] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const subtotal = items.reduce((s, i) => s + i.quantity * parseFloat(i.unit_price || "0"), 0);
  const taxAmount = subtotal * (parseFloat(taxRate) / 100);
  const total = subtotal + taxAmount;

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string | number) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const toggleChain = (chain: ChainId) => {
    setSelectedChains((prev) =>
      prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain]
    );
  };

  const createMut = useMutation({
    mutationFn: () => invoices.create({
      customer_name: customer.name,
      customer_email: customer.email,
      items: items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })),
      currency,
      chains: selectedChains,
      tax_rate: parseFloat(taxRate),
      due_date: dueDate,
      notes: notes || undefined,
    }),
    onSuccess: (inv) => {
      toast.success("Invoice created");
      navigate(`/dashboard/invoices/${inv.id}`);
    },
    onError: () => toast.error("Failed to create invoice"),
  });

  const canSubmit = customer.name.trim() && customer.email.trim() && items.every((i) => i.description.trim() && parseFloat(i.unit_price) > 0) && dueDate && selectedChains.length > 0;

  return (
    <div className="space-y-6 max-w-3xl" data-testid="page:dashboard-invoices-new">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">{t("createInvoice.title")}</h1>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader><CardTitle className="text-sm">{t("createInvoice.customerInfo")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("createInvoice.customerName")} *</Label>
              <Input placeholder="Acme Corp" value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("createInvoice.customerEmail")} *</Label>
              <Input type="email" placeholder="billing@acme.com" value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">{t("createInvoice.lineItems")}</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}><PlusCircle className="mr-1.5 h-3.5 w-3.5" />{t("createInvoice.addItem")}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_80px_120px_32px] items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("table.description")}</Label>
                <Input placeholder="Service or product" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("table.qty")}</Label>
                <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("table.unitPrice")}</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", e.target.value)} />
              </div>
              {items.length > 1 && (
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader><CardTitle className="text-sm">{t("createInvoice.paymentSettings")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("createCharge.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("createInvoice.taxRate")}</Label>
              <Input type="number" step="0.1" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("table.dueDate")} *</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("createInvoice.acceptedChains")} *</Label>
            <div className="flex flex-wrap gap-3 mt-1">
              {chains.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={selectedChains.includes(c.id)} onCheckedChange={() => toggleChain(c.id)} />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("createInvoice.notes")}</Label>
            <Textarea placeholder="Additional notes for the customer..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("createInvoice.subtotal")}</span><span className="font-mono">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("createInvoice.tax")} ({taxRate}%)</span><span className="font-mono">${taxAmount.toFixed(2)}</span></div>
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>{t("createInvoice.total")}</span><span className="font-mono font-display">${total.toFixed(2)} {currency}</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => createMut.mutate()} disabled={!canSubmit || createMut.isPending} className="bg-gradient-gold text-primary-foreground">
              <Save className="mr-1.5 h-3.5 w-3.5" />{createMut.isPending ? t("createInvoice.creating") : t("createInvoice.saveAsDraft")}
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>{t("common.cancel") || "Cancel"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
