import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState } from "react";
import { toast } from "sonner";
import { Percent, Save, Users } from "lucide-react";
import type { FeeConfig, MerchantFeeOverride } from "@/lib/types";

export default function FeeManagement() {
  usePageTitle("Fee Management");
  const qc = useQueryClient();

  const { data: feeConfig, isLoading: configLoading } = useQuery({
    queryKey: ["admin-fee-config"],
    queryFn: admin.fees.getConfig,
  });

  const { data: overrides, isLoading: overridesLoading } = useQuery({
    queryKey: ["admin-fee-overrides"],
    queryFn: admin.fees.listOverrides,
  });

  const [globalRate, setGlobalRate] = useState("");
  const [minFee, setMinFee] = useState("");
  const [overrideMerchantId, setOverrideMerchantId] = useState("");
  const [overrideRate, setOverrideRate] = useState("");

  const updateGlobal = useMutation({
    mutationFn: (data: Partial<FeeConfig>) => admin.fees.updateConfig(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fee-config"] });
      toast.success("Global fee updated");
    },
  });

  const addOverride = useMutation({
    mutationFn: (data: { merchant_id: string; rate_percent: number }) => admin.fees.setOverride(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fee-overrides"] });
      setOverrideMerchantId("");
      setOverrideRate("");
      toast.success("Merchant override saved");
    },
  });

  const removeOverride = useMutation({
    mutationFn: (merchantId: string) => admin.fees.removeOverride(merchantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fee-overrides"] });
      toast.success("Override removed");
    },
  });

  if (configLoading && overridesLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6" data-testid="page:admin-fees">
      <h1 className="text-lg font-semibold">Fee Management</h1>

      {/* Global Fee Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Percent className="h-4 w-4" /> Global Fee Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs text-muted-foreground">Current Rate</Label>
              <p className="text-2xl font-bold font-mono">{feeConfig?.rate_percent ?? "0.5"}%</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Min Fee (USD)</Label>
              <p className="text-2xl font-bold font-mono">${feeConfig?.min_fee_usd ?? "0.00"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fee Model</Label>
              <p className="text-2xl font-bold">{feeConfig?.model ?? "flat"}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="globalRate" className="text-xs">New Rate (%)</Label>
              <Input
                id="globalRate"
                placeholder="0.5"
                value={globalRate}
                onChange={(e) => setGlobalRate(e.target.value)}
                className="h-8 text-sm"
                type="number"
                step="0.01"
                min="0"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor="minFee" className="text-xs">Min Fee (USD)</Label>
              <Input
                id="minFee"
                placeholder="0.00"
                value={minFee}
                onChange={(e) => setMinFee(e.target.value)}
                className="h-8 text-sm"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                className="h-8"
                disabled={updateGlobal.isPending || (!globalRate && !minFee)}
                onClick={() => updateGlobal.mutate({
                  ...(globalRate ? { rate_percent: parseFloat(globalRate) } : {}),
                  ...(minFee ? { min_fee_usd: parseFloat(minFee) } : {}),
                })}
              >
                <Save className="h-3.5 w-3.5 mr-1" /> Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Merchant Fee Overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" /> Per-Merchant Fee Overrides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 border-b border-border pb-4">
            <div>
              <Label htmlFor="overrideMerchant" className="text-xs">Merchant ID</Label>
              <Input
                id="overrideMerchant"
                placeholder="merchant_xxx"
                value={overrideMerchantId}
                onChange={(e) => setOverrideMerchantId(e.target.value)}
                className="h-8 text-sm"
                maxLength={64}
              />
            </div>
            <div>
              <Label htmlFor="overrideRate" className="text-xs">Custom Rate (%)</Label>
              <Input
                id="overrideRate"
                placeholder="0.3"
                value={overrideRate}
                onChange={(e) => setOverrideRate(e.target.value)}
                className="h-8 text-sm"
                type="number"
                step="0.01"
                min="0"
                max="10"
              />
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                className="h-8"
                disabled={addOverride.isPending || !overrideMerchantId || !overrideRate}
                onClick={() => addOverride.mutate({
                  merchant_id: overrideMerchantId,
                  rate_percent: parseFloat(overrideRate),
                })}
              >
                Add Override
              </Button>
            </div>
          </div>

          {overrides && overrides.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-2">Merchant</th>
                  <th className="px-4 py-2">Custom Rate</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {overrides.map((o) => (
                  <tr key={o.merchant_id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{o.merchant_id}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="font-mono text-xs">{o.rate_percent}%</Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={removeOverride.isPending}
                        onClick={() => removeOverride.mutate(o.merchant_id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No merchant overrides. All merchants use the global rate.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
