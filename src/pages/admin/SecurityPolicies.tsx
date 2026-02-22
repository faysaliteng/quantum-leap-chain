import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { securityPolicies } from "@/lib/api-extended";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import {
  Shield, Lock, Key, Clock, Globe, Zap, Users, AlertTriangle,
  Save, RefreshCw, ShieldCheck, Monitor, Ban,
} from "lucide-react";
import type { SecurityPolicies, PasswordPolicy, SessionPolicy, AccessPolicy, RateLimitPolicy } from "@/lib/types-extended";

export default function AdminSecurityPolicies() {
  const { t } = useI18n();
  usePageTitle(t("admin.securityPolicies"));
  const qc = useQueryClient();

  const { data: policies, isLoading } = useQuery({
    queryKey: ["security-policies"],
    queryFn: securityPolicies.get,
  });

  const [pw, setPw] = useState<PasswordPolicy | null>(null);
  const [sess, setSess] = useState<SessionPolicy | null>(null);
  const [acc, setAcc] = useState<AccessPolicy | null>(null);
  const [rl, setRl] = useState<RateLimitPolicy | null>(null);
  const [newIp, setNewIp] = useState("");
  const [newCountry, setNewCountry] = useState("");

  // Initialize from fetched data
  const password = pw ?? policies?.password ?? { min_length: 12, require_uppercase: true, require_number: true, require_symbol: true, history_count: 5, expiry_days: 90 };
  const session = sess ?? policies?.session ?? { access_token_ttl_minutes: 15, refresh_token_ttl_days: 7, max_sessions: 5, mandatory_2fa_admin: true, idle_timeout_minutes: 30 };
  const access = acc ?? policies?.access ?? { maintenance_mode: false, bypass_ips: [], ip_allowlist_enabled: false, ip_allowlist: [], geo_block_enabled: false, geo_blocked_countries: [] };
  const rateLimit = rl ?? policies?.rate_limit ?? { public_rpm: 60, auth_rpm: 10, merchant_api_rpm: 120, webhook_delivery_rpm: 500 };

  const saveMut = useMutation({
    mutationFn: (data: Partial<SecurityPolicies>) => securityPolicies.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security-policies"] });
      toast.success(t("admin.securityPolicies") + " — " + t("common.save"));
    },
    onError: () => toast.error(t("admin.failed")),
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6" data-testid="page:admin-security-policies">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />{t("admin.securityPolicies")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("admin.securityEnforcement")}</p>
        </div>
        {policies?.updated_at && (
          <Badge variant="outline" className="text-xs">{t("admin.lastUpdated")}: {new Date(policies.updated_at).toLocaleDateString()}</Badge>
        )}
      </div>

      <Tabs defaultValue="password">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="password" className="text-xs gap-1"><Key className="h-3.5 w-3.5" />{t("admin.passwordTab")}</TabsTrigger>
          <TabsTrigger value="session" className="text-xs gap-1"><Clock className="h-3.5 w-3.5" />{t("admin.sessionsTab")}</TabsTrigger>
          <TabsTrigger value="access" className="text-xs gap-1"><Globe className="h-3.5 w-3.5" />{t("admin.accessTab")}</TabsTrigger>
          <TabsTrigger value="ratelimit" className="text-xs gap-1"><Zap className="h-3.5 w-3.5" />{t("admin.rateLimitsTab")}</TabsTrigger>
        </TabsList>

        {/* Password Policy */}
        <TabsContent value="password" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" />{t("admin.passwordPolicy")}</CardTitle>
              <CardDescription>{t("admin.passwordPolicyDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.minimumLength")}</Label>
                  <Input type="number" min={8} max={128} value={password.min_length} onChange={(e) => setPw({ ...password, min_length: +e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.passwordHistory")}</Label>
                  <Input type="number" min={0} max={24} value={password.history_count} onChange={(e) => setPw({ ...password, history_count: +e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t("admin.preventReuse")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.passwordExpiry")}</Label>
                <Input type="number" min={0} max={365} value={password.expiry_days} onChange={(e) => setPw({ ...password, expiry_days: +e.target.value })} />
              </div>
              <Separator />
              <div className="space-y-3">
                {([
                  ["require_uppercase", t("admin.requireUppercase")],
                  ["require_number", t("admin.requireNumber")],
                  ["require_symbol", t("admin.requireSymbol")],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <Switch checked={password[key]} onCheckedChange={(v) => setPw({ ...password, [key]: v })} />
                  </div>
                ))}
              </div>
              <Button onClick={() => saveMut.mutate({ password })} disabled={saveMut.isPending} className="bg-gradient-gold text-primary-foreground">
                <Save className="mr-1.5 h-4 w-4" />{t("admin.savePasswordPolicy")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Policy */}
        <TabsContent value="session" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />{t("admin.sessionPolicy")}</CardTitle>
              <CardDescription>{t("admin.sessionPolicyDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.accessTokenTtl")}</Label>
                  <Input type="number" min={5} max={60} value={session.access_token_ttl_minutes} onChange={(e) => setSess({ ...session, access_token_ttl_minutes: +e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.refreshTokenTtl")}</Label>
                  <Input type="number" min={1} max={30} value={session.refresh_token_ttl_days} onChange={(e) => setSess({ ...session, refresh_token_ttl_days: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.maxSessions")}</Label>
                  <Input type="number" min={1} max={50} value={session.max_sessions} onChange={(e) => setSess({ ...session, max_sessions: +e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.idleTimeout")}</Label>
                  <Input type="number" min={5} max={120} value={session.idle_timeout_minutes} onChange={(e) => setSess({ ...session, idle_timeout_minutes: +e.target.value })} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{t("admin.mandatory2fa")}</span>
                  <p className="text-xs text-muted-foreground">{t("admin.mandatory2faDesc")}</p>
                </div>
                <Switch checked={session.mandatory_2fa_admin} onCheckedChange={(v) => setSess({ ...session, mandatory_2fa_admin: v })} />
              </div>
              <Button onClick={() => saveMut.mutate({ session })} disabled={saveMut.isPending} className="bg-gradient-gold text-primary-foreground">
                <Save className="mr-1.5 h-4 w-4" />{t("admin.saveSessionPolicy")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Policy */}
        <TabsContent value="access" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" />{t("admin.accessControl")}</CardTitle>
              <CardDescription>{t("admin.accessControlDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div>
                  <span className="text-sm font-medium flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-warning" />{t("admin.maintenanceMode")}</span>
                  <p className="text-xs text-muted-foreground">{t("admin.blockNonAdmin")}</p>
                </div>
                <Switch checked={access.maintenance_mode} onCheckedChange={(v) => setAcc({ ...access, maintenance_mode: v })} />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("admin.ipAllowlist")}</span>
                  <Switch checked={access.ip_allowlist_enabled} onCheckedChange={(v) => setAcc({ ...access, ip_allowlist_enabled: v })} />
                </div>
                {access.ip_allowlist_enabled && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="e.g. 203.0.113.0/24" value={newIp} onChange={(e) => setNewIp(e.target.value)} className="font-mono text-sm" />
                      <Button size="sm" onClick={() => { if (newIp) { setAcc({ ...access, ip_allowlist: [...access.ip_allowlist, newIp] }); setNewIp(""); } }}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {access.ip_allowlist.map((ip, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-xs gap-1">
                          {ip}
                          <button onClick={() => setAcc({ ...access, ip_allowlist: access.ip_allowlist.filter((_, j) => j !== i) })} className="ml-1 text-destructive">×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("admin.bypassIps")}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {access.bypass_ips.map((ip, i) => (
                    <Badge key={i} variant="secondary" className="font-mono text-xs gap-1">
                      {ip}
                      <button onClick={() => setAcc({ ...access, bypass_ips: access.bypass_ips.filter((_, j) => j !== i) })} className="ml-1 text-destructive">×</button>
                    </Badge>
                  ))}
                  <Input
                    placeholder={t("admin.addBypassIp")}
                    className="w-40 h-7 text-xs font-mono"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                        setAcc({ ...access, bypass_ips: [...access.bypass_ips, (e.target as HTMLInputElement).value] });
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("admin.geoBlocking")}</span>
                  <Switch checked={access.geo_block_enabled} onCheckedChange={(v) => setAcc({ ...access, geo_block_enabled: v })} />
                </div>
                {access.geo_block_enabled && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="Country code (e.g. KP, IR)" value={newCountry} onChange={(e) => setNewCountry(e.target.value.toUpperCase())} className="font-mono text-sm uppercase" />
                      <Button size="sm" onClick={() => { if (newCountry) { setAcc({ ...access, geo_blocked_countries: [...access.geo_blocked_countries, newCountry] }); setNewCountry(""); } }}>Block</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {access.geo_blocked_countries.map((c, i) => (
                        <Badge key={i} variant="destructive" className="text-xs gap-1">
                          {c}
                          <button onClick={() => setAcc({ ...access, geo_blocked_countries: access.geo_blocked_countries.filter((_, j) => j !== i) })} className="ml-1">×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={() => saveMut.mutate({ access })} disabled={saveMut.isPending} className="bg-gradient-gold text-primary-foreground">
                <Save className="mr-1.5 h-4 w-4" />{t("admin.saveAccessPolicy")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Limits */}
        <TabsContent value="ratelimit" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4" />{t("admin.rateLimitsRedis")}</CardTitle>
              <CardDescription>{t("admin.rpmDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["public_rpm", t("admin.publicEndpoints"), t("admin.publicDesc")],
                  ["auth_rpm", t("admin.authEndpoints"), t("admin.authDesc")],
                  ["merchant_api_rpm", t("admin.merchantApi"), t("admin.merchantApiDesc")],
                  ["webhook_delivery_rpm", t("admin.webhookDelivery"), t("admin.webhookDeliveryDesc")],
                ] as const).map(([key, label, desc]) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Input type="number" min={1} max={10000} value={rateLimit[key]} onChange={(e) => setRl({ ...rateLimit, [key]: +e.target.value })} />
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => saveMut.mutate({ rate_limit: rateLimit })} disabled={saveMut.isPending} className="bg-gradient-gold text-primary-foreground">
                <Save className="mr-1.5 h-4 w-4" />{t("admin.saveRateLimits")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}