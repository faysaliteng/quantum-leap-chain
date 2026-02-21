import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { charges as chargesApi } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateChargeRequest, PricingType } from "@/lib/types";

export default function CreateCharge() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateChargeRequest>({
    name: "",
    pricing_type: "fixed_price",
    local_price: { amount: "", currency: "USD" },
    expires_in_minutes: 60,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateChargeRequest) => chargesApi.create(data, crypto.randomUUID()),
    onSuccess: (charge) => navigate(`/dashboard/charges/${charge.id}`),
  });

  const update = <K extends keyof CreateChargeRequest>(key: K, value: CreateChargeRequest[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold">Create Charge</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Payment for Order #123" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} placeholder="Optional details" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pricing Type</Label>
              <Select value={form.pricing_type} onValueChange={(v: PricingType) => update("pricing_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_price">Fixed Price</SelectItem>
                  <SelectItem value="no_price">Donation (Any Amount)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry (minutes)</Label>
              <Input type="number" value={form.expires_in_minutes ?? 60} onChange={(e) => update("expires_in_minutes", parseInt(e.target.value) || 60)} />
            </div>
          </div>

          {form.pricing_type === "fixed_price" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="text" value={form.local_price?.amount ?? ""} onChange={(e) => update("local_price", { amount: e.target.value, currency: form.local_price?.currency ?? "USD" })} placeholder="100.00" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.local_price?.currency ?? "USD"} onValueChange={(v) => update("local_price", { amount: form.local_price?.amount ?? "", currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Redirect URL</Label>
              <Input value={form.redirect_url ?? ""} onChange={(e) => update("redirect_url", e.target.value)} placeholder="https://yoursite.com/success" />
            </div>
            <div className="space-y-2">
              <Label>Cancel URL</Label>
              <Input value={form.cancel_url ?? ""} onChange={(e) => update("cancel_url", e.target.value)} placeholder="https://yoursite.com/cancel" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Metadata (JSON)</Label>
            <Textarea
              rows={3}
              placeholder='{"order_id": "abc123"}'
              onChange={(e) => {
                try { update("metadata", JSON.parse(e.target.value)); } catch {}
              }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => mutation.mutate(form)} disabled={!form.name || mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create Charge"}
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
          {mutation.isError && <p className="text-sm text-destructive">{(mutation.error as any)?.response?.data?.message || "Failed to create charge"}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
