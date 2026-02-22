import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import { Save, Settings, AlertTriangle } from "lucide-react";
import type { CMSSettings as CMSSettingsType } from "@/lib/types";

export default function CMSSettings() {
  const { t } = useI18n();
  usePageTitle(t("cms.settings"));
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["cms-settings"],
    queryFn: admin.cms.settings.get,
  });

  const [form, setForm] = useState<Partial<CMSSettingsType>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: () => admin.cms.settings.update(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-settings"] }); toast.success(t("cms.settingsSaved")); },
    onError: () => toast.error(t("admin.failed")),
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6" data-testid="page:admin-cms-settings">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("cms.settings")}</h1>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          <Save className="mr-1.5 h-3.5 w-3.5" />{t("cms.saveSettings")}
        </Button>
      </div>

      {/* SEO Defaults */}
      <Card>
        <CardHeader><CardTitle className="text-sm">{t("cms.seoDefaults")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("cms.siteTitleTemplate")}</Label>
            <Input
              placeholder="%s — Cryptoniumpay"
              value={form.site_title_template ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, site_title_template: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{t("cms.siteTitleHelp")}</p>
          </div>
          <div className="space-y-1.5">
            <Label>{t("cms.defaultOgImage")}</Label>
            <Input
              placeholder="https://cryptoniumpay.com/og-image.png"
              value={form.default_og_image ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, default_og_image: e.target.value }))}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social URLs */}
      <Card>
        <CardHeader><CardTitle className="text-sm">{t("cms.socialUrls")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {["twitter", "github", "discord", "telegram", "linkedin"].map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="capitalize">{key}</Label>
              <Input
                placeholder={`https://${key}.com/cryptoniumpay`}
                value={form.social_urls?.[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, social_urls: { ...f.social_urls, [key]: e.target.value } }))}
                className="font-mono text-sm"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader><CardTitle className="text-sm">{t("cms.analytics")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("cms.gtmId")}</Label>
            <Input
              placeholder="G-XXXXXXXXXX or GTM-XXXXXXX"
              value={form.analytics_id ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, analytics_id: e.target.value }))}
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {t("cms.maintenanceMode")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("cms.enableMaintenance")}</p>
              <p className="text-xs text-muted-foreground">{t("cms.maintenanceDesc")}</p>
            </div>
            <Switch
              checked={form.maintenance_mode ?? false}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, maintenance_mode: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}