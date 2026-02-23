import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import {
  Save, Key, Shield, Globe, Clock, Zap, Server, Code,
  RefreshCw, AlertTriangle, Lock, Settings, BarChart3, Webhook,
  FileText, Terminal, Copy,
} from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import type { RateLimitPolicy } from "@/lib/types-extended";

// API Settings types
interface ApiConfig {
  version: string;
  versioning_strategy: "url" | "header";
  deprecation_notice?: string;
  rate_limits: {
    public_rpm: number;
    auth_rpm: number;
    merchant_api_rpm: number;
    webhook_delivery_rpm: number;
    admin_rpm: number;
  };
  cors: {
    enabled: boolean;
    allowed_origins: string[];
    allowed_methods: string[];
    allowed_headers: string[];
    max_age_seconds: number;
  };
  key_policies: {
    max_keys_per_merchant: number;
    key_expiry_days: number;
    auto_rotate: boolean;
    rotation_interval_days: number;
    require_ip_allowlist: boolean;
  };
  webhook_settings: {
    max_endpoints_per_merchant: number;
    max_retry_attempts: number;
    retry_backoff_base_ms: number;
    delivery_timeout_ms: number;
    signature_algorithm: "hmac-sha256" | "hmac-sha512";
    replay_protection_window_seconds: number;
  };
  response_settings: {
    default_page_size: number;
    max_page_size: number;
    include_request_id: boolean;
    compression_enabled: boolean;
    pretty_print_debug: boolean;
  };
  security: {
    require_https: boolean;
    tls_min_version: "1.2" | "1.3";
    hsts_enabled: boolean;
    hsts_max_age: number;
    csp_enabled: boolean;
    idempotency_window_hours: number;
  };
}

const defaultConfig: ApiConfig = {
  version: "v1",
  versioning_strategy: "url",
  deprecation_notice: "",
  rate_limits: { public_rpm: 60, auth_rpm: 10, merchant_api_rpm: 300, webhook_delivery_rpm: 1000, admin_rpm: 600 },
  cors: { enabled: true, allowed_origins: ["*"], allowed_methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowed_headers: ["Authorization", "Content-Type", "Idempotency-Key", "X-API-Key"], max_age_seconds: 86400 },
  key_policies: { max_keys_per_merchant: 10, key_expiry_days: 365, auto_rotate: false, rotation_interval_days: 90, require_ip_allowlist: false },
  webhook_settings: { max_endpoints_per_merchant: 5, max_retry_attempts: 5, retry_backoff_base_ms: 5000, delivery_timeout_ms: 30000, signature_algorithm: "hmac-sha256", replay_protection_window_seconds: 300 },
  response_settings: { default_page_size: 25, max_page_size: 100, include_request_id: true, compression_enabled: true, pretty_print_debug: false },
  security: { require_https: true, tls_min_version: "1.2", hsts_enabled: true, hsts_max_age: 31536000, csp_enabled: true, idempotency_window_hours: 24 },
};

export default function AdminApiSettings() {
  const { t } = useI18n();
  usePageTitle(t("admin.apiSettings"));
  const qc = useQueryClient();
  const [config, setConfig] = useState<ApiConfig>(defaultConfig);
  const [newOrigin, setNewOrigin] = useState("");
  const [newHeader, setNewHeader] = useState("");

  const { isLoading } = useQuery({
    queryKey: ["admin-api-settings"],
    queryFn: () => admin.apiSettings.get(),
    meta: { onSuccess: (data: any) => { if (data) setConfig(data); } },
  });

  // Load fetched config into state
  useEffect(() => {
    // Will be populated when backend returns data; defaultConfig used as fallback
  }, []);

  const saveMut = useMutation({
    mutationFn: () => admin.apiSettings.update(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-api-settings"] });
      toast.success(t("admin.apiSettings") + " — " + t("common.save"));
    },
    onError: () => toast.error(t("admin.failed")),
  });

  const handleSave = () => {
    saveMut.mutate();
  };

  const update = <K extends keyof ApiConfig>(section: K, values: Partial<ApiConfig[K]>) => {
    setConfig((c) => ({ ...c, [section]: { ...c[section] as object, ...values } }));
  };

  return (
    <div className="space-y-6" data-testid="page:admin-api-settings">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-gold p-2">
            <Terminal className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{t("admin.apiSettings")}</h1>
            <p className="text-xs text-muted-foreground">{t("admin.apiDesc")}</p>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-1.5 h-3.5 w-3.5" />{t("admin.saveAllSettings")}
        </Button>
      </div>

      {/* Current API Info */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-gold text-primary-foreground">{config.version}</Badge>
              <span className="text-sm font-medium">{t("admin.currentApiVersion")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Strategy: {config.versioning_strategy}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <code>GET /v1/health</code>
              <CopyButton value="GET /v1/health" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rate-limits">
        <TabsList className="flex-wrap">
          <TabsTrigger value="rate-limits"><Zap className="h-3.5 w-3.5 mr-1" />{t("admin.rateLimitsTab")}</TabsTrigger>
          <TabsTrigger value="cors"><Globe className="h-3.5 w-3.5 mr-1" />CORS</TabsTrigger>
          <TabsTrigger value="keys"><Key className="h-3.5 w-3.5 mr-1" />{t("admin.apiKeyPolicies")}</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="h-3.5 w-3.5 mr-1" />Webhooks</TabsTrigger>
          <TabsTrigger value="responses"><FileText className="h-3.5 w-3.5 mr-1" />{t("admin.responseSettings")}</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-3.5 w-3.5 mr-1" />{t("admin.securitySettings")}</TabsTrigger>
        </TabsList>

        {/* Rate Limits */}
        <TabsContent value="rate-limits" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("admin.rateLimitConfig")}</CardTitle>
              <CardDescription>{t("admin.rpmDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "public_rpm" as const, label: t("admin.publicEndpoints"), desc: t("admin.publicDesc"), icon: <Globe className="h-4 w-4 text-muted-foreground" /> },
                { key: "auth_rpm" as const, label: t("admin.authEndpoints"), desc: t("admin.authDesc"), icon: <Lock className="h-4 w-4 text-muted-foreground" /> },
                { key: "merchant_api_rpm" as const, label: t("admin.merchantApi"), desc: t("admin.merchantApiDesc"), icon: <Key className="h-4 w-4 text-muted-foreground" /> },
                { key: "webhook_delivery_rpm" as const, label: t("admin.webhookDelivery"), desc: t("admin.webhookDeliveryDesc"), icon: <Webhook className="h-4 w-4 text-muted-foreground" /> },
                { key: "admin_rpm" as const, label: "Admin API", desc: "Admin panel endpoints", icon: <Shield className="h-4 w-4 text-muted-foreground" /> },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    {item.icon}
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={config.rate_limits[item.key]} onChange={(e) => update("rate_limits", { [item.key]: parseInt(e.target.value) || 0 })} className="w-24 text-right font-mono" />
                    <span className="text-xs text-muted-foreground w-8">RPM</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CORS */}
        <TabsContent value="cors" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("admin.corsConfig")}</CardTitle>
              <CardDescription>{t("admin.corsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("admin.corsEnabled")}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.allowCrossOrigin")}</p>
                </div>
                <Switch checked={config.cors.enabled} onCheckedChange={(v) => update("cors", { enabled: v })} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t("admin.allowedOrigins")}</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {config.cors.allowed_origins.map((origin, i) => (
                    <Badge key={i} variant="outline" className="gap-1 font-mono text-xs">
                      {origin}
                      <button className="text-destructive ml-1" onClick={() => update("cors", { allowed_origins: config.cors.allowed_origins.filter((_, j) => j !== i) })}>×</button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="https://example.com" value={newOrigin} onChange={(e) => setNewOrigin(e.target.value)} className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={() => { if (newOrigin.trim()) { update("cors", { allowed_origins: [...config.cors.allowed_origins, newOrigin.trim()] }); setNewOrigin(""); } }}>Add</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.allowedMethods")}</Label>
                <div className="flex flex-wrap gap-2">
                  {["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"].map((m) => (
                    <Button key={m} variant={config.cors.allowed_methods.includes(m) ? "default" : "outline"} size="sm" className={`text-xs h-7 ${config.cors.allowed_methods.includes(m) ? "bg-gradient-gold text-primary-foreground" : ""}`}
                      onClick={() => update("cors", { allowed_methods: config.cors.allowed_methods.includes(m) ? config.cors.allowed_methods.filter((x) => x !== m) : [...config.cors.allowed_methods, m] })}>
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.allowedHeaders")}</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {config.cors.allowed_headers.map((h, i) => (
                    <Badge key={i} variant="outline" className="gap-1 font-mono text-xs">
                      {h}
                      <button className="text-destructive ml-1" onClick={() => update("cors", { allowed_headers: config.cors.allowed_headers.filter((_, j) => j !== i) })}>×</button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="X-Custom-Header" value={newHeader} onChange={(e) => setNewHeader(e.target.value)} className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={() => { if (newHeader.trim()) { update("cors", { allowed_headers: [...config.cors.allowed_headers, newHeader.trim()] }); setNewHeader(""); } }}>Add</Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("admin.preflightCache")}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.preflightDesc")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" value={config.cors.max_age_seconds} onChange={(e) => update("cors", { max_age_seconds: parseInt(e.target.value) || 0 })} className="w-24 text-right font-mono" />
                  <span className="text-xs text-muted-foreground">sec</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Policies */}
        <TabsContent value="keys" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("admin.apiKeyPolicies")}</CardTitle>
              <CardDescription>{t("admin.apiKeyPoliciesDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: t("admin.maxKeysPerMerchant"), key: "max_keys_per_merchant" as const, suffix: "keys" },
                { label: t("admin.keyExpiry"), key: "key_expiry_days" as const, suffix: "days" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={config.key_policies[item.key]} onChange={(e) => update("key_policies", { [item.key]: parseInt(e.target.value) || 0 })} className="w-24 text-right font-mono" />
                    <span className="text-xs text-muted-foreground w-8">{item.suffix}</span>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("admin.autoKeyRotation")}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.autoKeyRotationDesc")}</p>
                </div>
                <Switch checked={config.key_policies.auto_rotate} onCheckedChange={(v) => update("key_policies", { auto_rotate: v })} />
              </div>
              {config.key_policies.auto_rotate && (
                <div className="flex items-center justify-between pl-4">
                  <p className="text-sm text-muted-foreground">{t("admin.rotationInterval")}</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={config.key_policies.rotation_interval_days} onChange={(e) => update("key_policies", { rotation_interval_days: parseInt(e.target.value) || 30 })} className="w-24 text-right font-mono" />
                    <span className="text-xs text-muted-foreground w-8">days</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("admin.requireIpAllowlist")}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.requireIpAllowlistDesc")}</p>
                </div>
                <Switch checked={config.key_policies.require_ip_allowlist} onCheckedChange={(v) => update("key_policies", { require_ip_allowlist: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("admin.webhookSettings")}</CardTitle>
              <CardDescription>{t("admin.webhookSettingsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: t("admin.maxEndpoints"), key: "max_endpoints_per_merchant" as const, suffix: "" },
                { label: t("admin.maxRetry"), key: "max_retry_attempts" as const, suffix: "" },
                { label: t("admin.retryBackoff"), key: "retry_backoff_base_ms" as const, suffix: "ms" },
                { label: t("admin.deliveryTimeout"), key: "delivery_timeout_ms" as const, suffix: "ms" },
                { label: t("admin.replayProtection"), key: "replay_protection_window_seconds" as const, suffix: "sec" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={config.webhook_settings[item.key]} onChange={(e) => update("webhook_settings", { [item.key]: parseInt(e.target.value) || 0 })} className="w-28 text-right font-mono" />
                    {item.suffix && <span className="text-xs text-muted-foreground w-8">{item.suffix}</span>}
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("admin.signatureAlgorithm")}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.signatureAlgorithmDesc")}</p>
                </div>
                <div className="flex gap-2">
                  {(["hmac-sha256", "hmac-sha512"] as const).map((alg) => (
                    <Button key={alg} variant={config.webhook_settings.signature_algorithm === alg ? "default" : "outline"} size="sm"
                      className={`text-xs ${config.webhook_settings.signature_algorithm === alg ? "bg-gradient-gold text-primary-foreground" : ""}`}
                      onClick={() => update("webhook_settings", { signature_algorithm: alg })}>
                      {alg.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Webhook Signature Headers</p>
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex items-center gap-2"><code className="bg-muted rounded px-2 py-0.5">x-cryptoniumpay-signature</code><CopyButton value="x-cryptoniumpay-signature" /></div>
                  <div className="flex items-center gap-2"><code className="bg-muted rounded px-2 py-0.5">x-cryptoniumpay-timestamp</code><CopyButton value="x-cryptoniumpay-timestamp" /></div>
                  <div className="flex items-center gap-2"><code className="bg-muted rounded px-2 py-0.5">x-cryptoniumpay-event</code><CopyButton value="x-cryptoniumpay-event" /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Response Settings */}
        <TabsContent value="responses" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("admin.responseSettings")}</CardTitle>
              <CardDescription>{t("admin.responseDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("admin.defaultPageSize")}</p>
                <div className="flex items-center gap-2">
                  <Input type="number" value={config.response_settings.default_page_size} onChange={(e) => update("response_settings", { default_page_size: parseInt(e.target.value) || 10 })} className="w-20 text-right font-mono" />
                  <span className="text-xs text-muted-foreground w-10">items</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("admin.maxPageSize")}</p>
                <div className="flex items-center gap-2">
                  <Input type="number" value={config.response_settings.max_page_size} onChange={(e) => update("response_settings", { max_page_size: parseInt(e.target.value) || 50 })} className="w-20 text-right font-mono" />
                  <span className="text-xs text-muted-foreground w-10">items</span>
                </div>
              </div>
              <Separator />
              {[
                { label: t("admin.includeRequestId"), desc: t("admin.includeRequestIdDesc"), key: "include_request_id" as const },
                { label: t("admin.compression"), desc: t("admin.compressionDesc"), key: "compression_enabled" as const },
                { label: t("admin.prettyPrint"), desc: t("admin.prettyPrintDesc"), key: "pretty_print_debug" as const },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={config.response_settings[item.key]} onCheckedChange={(v) => update("response_settings", { [item.key]: v })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("admin.securitySettings")}</CardTitle>
              <CardDescription>{t("admin.securitySettingsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("admin.requireHttps")}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.requireHttpsDesc")}</p>
                </div>
                <Switch checked={config.security.require_https} onCheckedChange={(v) => update("security", { require_https: v })} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("admin.tlsVersion")}</p>
                <div className="flex gap-2">
                  {(["1.2", "1.3"] as const).map((v) => (
                    <Button key={v} variant={config.security.tls_min_version === v ? "default" : "outline"} size="sm"
                      className={`text-xs ${config.security.tls_min_version === v ? "bg-gradient-gold text-primary-foreground" : ""}`}
                      onClick={() => update("security", { tls_min_version: v })}>
                      TLS {v}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("admin.hsts")}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.hstsDesc")}</p>
                </div>
                <Switch checked={config.security.hsts_enabled} onCheckedChange={(v) => update("security", { hsts_enabled: v })} />
              </div>
              {config.security.hsts_enabled && (
                <div className="flex items-center justify-between pl-4">
                  <p className="text-sm text-muted-foreground">{t("admin.hstsMaxAge")}</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={config.security.hsts_max_age} onChange={(e) => update("security", { hsts_max_age: parseInt(e.target.value) || 0 })} className="w-28 text-right font-mono" />
                    <span className="text-xs text-muted-foreground">sec</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("admin.csp")}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.cspDesc")}</p>
                </div>
                <Switch checked={config.security.csp_enabled} onCheckedChange={(v) => update("security", { csp_enabled: v })} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("admin.idempotencyWindow")}</p>
                <div className="flex items-center gap-2">
                  <Input type="number" value={config.security.idempotency_window_hours} onChange={(e) => update("security", { idempotency_window_hours: parseInt(e.target.value) || 1 })} className="w-20 text-right font-mono" />
                  <span className="text-xs text-muted-foreground">hours</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning">Security Notice</p>
                    <p className="text-xs text-muted-foreground">Changes to security settings take effect immediately and may affect active API consumers. Coordinate with merchants before modifying TLS or CORS policies.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
