import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { charges as chargesApi } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePageTitle } from "@/hooks/use-page-title";
import type { CreateChargeRequest, PricingType } from "@/lib/types";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const chargeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().max(1000).optional(),
  pricing_type: z.enum(["fixed_price", "no_price"]),
  local_price: z.object({
    amount: z.string().regex(/^\d+(\.\d{1,8})?$/, "Invalid amount"),
    currency: z.string().min(1),
  }).optional(),
  expires_in_minutes: z.number().min(5).max(1440),
  redirect_url: z.string().url().optional().or(z.literal("")),
  cancel_url: z.string().url().optional().or(z.literal("")),
});

export default function CreateCharge() {
  usePageTitle("Create Charge");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateChargeRequest>({
    name: "",
    pricing_type: "fixed_price",
    local_price: { amount: "", currency: "USD" },
    expires_in_minutes: 60,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: CreateChargeRequest) => chargesApi.create(data, crypto.randomUUID()),
    onSuccess: (charge) => {
      toast({ title: "Charge created", description: `${charge.name} — ${charge.id.slice(0, 8)}` });
      navigate(`/dashboard/charges/${charge.id}`);
    },
  });

  const update = <K extends keyof CreateChargeRequest>(key: K, value: CreateChargeRequest[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    const result = chargeSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path.join(".")] = issue.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    const cleaned = { ...form };
    if (cleaned.redirect_url === "") delete cleaned.redirect_url;
    if (cleaned.cancel_url === "") delete cleaned.cancel_url;
    if (cleaned.pricing_type === "no_price") delete cleaned.local_price;
    mutation.mutate(cleaned);
  };

  return (
    <div className="max-w-2xl space-y-6" data-testid="page:dashboard-charges-new">
      <h1 className="text-lg font-semibold">Create Charge</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Payment for Order #123" maxLength={200} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} placeholder="Optional details" rows={2} maxLength={1000} />
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
              <Input type="number" min={5} max={1440} value={form.expires_in_minutes ?? 60} onChange={(e) => update("expires_in_minutes", parseInt(e.target.value) || 60)} />
            </div>
          </div>

          {form.pricing_type === "fixed_price" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="text" value={form.local_price?.amount ?? ""} onChange={(e) => update("local_price", { amount: e.target.value, currency: form.local_price?.currency ?? "USD" })} placeholder="100.00" />
                {errors["local_price.amount"] && <p className="text-xs text-destructive">{errors["local_price.amount"]}</p>}
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
              {errors.redirect_url && <p className="text-xs text-destructive">{errors.redirect_url}</p>}
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
            <Button onClick={handleSubmit} disabled={!form.name || mutation.isPending}>
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
