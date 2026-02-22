import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settlement } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/use-page-title";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SettlementConfig, SweepMode } from "@/lib/types";
import { useState, useEffect } from "react";

export default function SettlementSettings() {
  const { t } = useI18n();
  usePageTitle(t("settings.settlement"));
  const qc = useQueryClient();
  const { data: configs } = useQuery({ queryKey: ["settlement-config"], queryFn: settlement.getConfig });
  const [editing, setEditing] = useState<SettlementConfig | null>(null);

  const save = useMutation({
    mutationFn: (cfg: SettlementConfig) => settlement.updateConfig(cfg),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settlement-config"] }); setEditing(null); },
  });

  return (
    <div className="space-y-4" data-testid="page:dashboard-settings-settlement">
      <h1 className="text-lg font-semibold">{t("settings.settlement")}</h1>
      <div className="grid gap-4">
        {configs?.map((cfg) => (
          <Card key={`${cfg.chain}-${cfg.asset}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono">{cfg.chain.toUpperCase()} / {cfg.asset}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1">
                <Label className="text-xs">Settlement Address</Label>
                <Input className="h-8 font-mono text-xs" value={editing?.chain === cfg.chain && editing?.asset === cfg.asset ? editing.address : cfg.address} onChange={(e) => setEditing({ ...cfg, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Sweep Mode</Label>
                  <Select value={editing?.chain === cfg.chain ? editing.sweep_mode : cfg.sweep_mode} onValueChange={(v: SweepMode) => setEditing({ ...cfg, sweep_mode: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="batched">Batched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Threshold</Label>
                  <Input className="h-8 font-mono text-xs" value={editing?.chain === cfg.chain ? editing.min_sweep_threshold : cfg.min_sweep_threshold} onChange={(e) => setEditing({ ...cfg, min_sweep_threshold: e.target.value })} />
                </div>
              </div>
              <Button size="sm" className="h-7 text-xs" onClick={() => editing && save.mutate(editing)} disabled={save.isPending}>Save</Button>
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">No settlement configs found. Configure via your backend.</p>}
      </div>
    </div>
  );
}
