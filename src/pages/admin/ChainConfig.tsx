import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function ChainConfig() {
  const { t } = useI18n();
  usePageTitle(t("admin.chains"));
  const qc = useQueryClient();
  const { data: chains, isLoading: chainsLoading } = useQuery({ queryKey: ["admin-chains"], queryFn: admin.chains.list });
  const { data: assets, isLoading: assetsLoading } = useQuery({ queryKey: ["admin-assets"], queryFn: admin.assets.list });

  const toggleAsset = useMutation({ mutationFn: ({ chain, symbol, enabled }: { chain: string; symbol: string; enabled: boolean }) => admin.assets.toggle(chain, symbol, enabled), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-assets"] }) });

  if (chainsLoading && assetsLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6" data-testid="page:admin-chains">
      <h1 className="text-lg font-semibold">{t("admin.chains")}</h1>

      <div className="space-y-4">
        {chains?.map((chain) => (
          <Card key={chain.chain}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono uppercase">{chain.name} ({chain.chain})</CardTitle>
                <Badge variant={chain.enabled ? "default" : "outline"} className="text-xs">{chain.enabled ? t("admin.enabled") : t("admin.disabled")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">{t("admin.confirmations")}: {chain.confirmation_threshold} · {t("admin.rpcs")}: {chain.rpc_endpoints.length}</div>
              <div className="space-y-2">
                {chain.rpc_endpoints.map((rpc) => (
                  <div key={rpc.id} className="flex items-center gap-2 text-xs">
                    <Badge variant={rpc.status === "healthy" ? "outline" : "destructive"} className="text-xs w-16 justify-center">{rpc.status}</Badge>
                    <span className="font-mono truncate flex-1">{rpc.url}</span>
                    {rpc.latency_ms != null && <span className="text-muted-foreground shrink-0">{rpc.latency_ms}ms</span>}
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-medium mb-2">{t("admin.assets")}</p>
                <div className="space-y-2">
                  {assets?.filter((a) => a.chain === chain.chain).map((asset) => (
                    <div key={`${asset.chain}-${asset.symbol}`} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{asset.symbol}</span>
                        <span className="text-xs text-muted-foreground">{asset.name}</span>
                        {asset.contract_address && <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">{asset.contract_address}</span>}
                      </div>
                      <Switch checked={asset.enabled} onCheckedChange={(v) => toggleAsset.mutate({ chain: asset.chain, symbol: asset.symbol, enabled: v })} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">{t("admin.noChains")}</p>}
      </div>
    </div>
  );
}
