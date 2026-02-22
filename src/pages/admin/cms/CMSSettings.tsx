import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
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
  usePageTitle("CMS Settings");
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-settings"] }); toast.success("Settings saved"); },
    onError: () => toast.error("Failed to save settings"),
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6" data-testid="page:admin-cms-settings">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">CMS Settings</h1>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          <Save className="mr-1.5 h-3.5 w-3.5" />Save Settings
        </Button>
      </div>

      {/* SEO Defaults */}
      <Card>
        <CardHeader><CardTitle className="text-sm">SEO Defaults</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Site Title Template</Label>
            <Input
              placeholder="%s — Cryptoniumpay"
              value={form.site_title_template ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, site_title_template: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Use %s as placeholder for page title</p>
          </div>
          <div className="space-y-1.5">
            <Label>Default OG Image URL</Label>
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
        <CardHeader><CardTitle className="text-sm">Social Media URLs</CardTitle></CardHeader>
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
        <CardHeader><CardTitle className="text-sm">Analytics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Google Analytics / GTM ID</Label>
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
            Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">When enabled, the site will show a maintenance page to all visitors.</p>
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
