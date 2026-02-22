import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import {
  Save, ExternalLink, Globe, PlusCircle, Trash2,
} from "lucide-react";

const defaultPlatforms = [
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/cryptoniumpay" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/cryptoniumpay" },
  { key: "discord", label: "Discord", placeholder: "https://discord.gg/cryptoniumpay" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/cryptoniumpay" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/cryptoniumpay" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@cryptoniumpay" },
  { key: "reddit", label: "Reddit", placeholder: "https://reddit.com/r/cryptoniumpay" },
  { key: "medium", label: "Medium", placeholder: "https://medium.com/@cryptoniumpay" },
];

export default function SocialLinksManager() {
  usePageTitle("Social Links");
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["cms-settings"],
    queryFn: admin.cms.settings.get,
  });

  const [urls, setUrls] = useState<Record<string, string>>({});
  const [customKey, setCustomKey] = useState("");
  const [customUrl, setCustomUrl] = useState("");

  useEffect(() => {
    if (settings?.social_urls) setUrls(settings.social_urls);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: () => admin.cms.settings.update({ social_urls: urls }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-settings"] });
      toast.success("Social links saved");
    },
    onError: () => toast.error("Failed to save"),
  });

  if (isLoading) return <PageSkeleton />;

  const customKeys = Object.keys(urls).filter(
    (k) => !defaultPlatforms.some((p) => p.key === k)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Social Media Links</h1>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          <Save className="mr-1.5 h-3.5 w-3.5" />Save All
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Manage social media links shown in the site footer, share bars, and docs pages. Leave a field empty to hide that platform.
      </p>

      {/* Standard platforms */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Platforms</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {defaultPlatforms.map((p) => (
            <div key={p.key} className="flex items-center gap-3">
              <Label className="w-24 shrink-0 text-right text-sm">{p.label}</Label>
              <Input
                placeholder={p.placeholder}
                value={urls[p.key] ?? ""}
                onChange={(e) => setUrls((u) => ({ ...u, [p.key]: e.target.value }))}
                className="font-mono text-sm"
              />
              {urls[p.key] && (
                <a href={urls[p.key]} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Custom Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customKeys.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <Badge variant="outline" className="w-24 justify-center shrink-0 font-mono text-xs">{k}</Badge>
              <Input
                value={urls[k] ?? ""}
                onChange={(e) => setUrls((u) => ({ ...u, [k]: e.target.value }))}
                className="font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => setUrls((u) => {
                  const next = { ...u };
                  delete next[k];
                  return next;
                })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <div className="flex items-end gap-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform Key</Label>
              <Input
                placeholder="e.g. tiktok"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="w-32 font-mono"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">URL</Label>
              <Input
                placeholder="https://..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!customKey.trim() || !customUrl.trim()}
              onClick={() => {
                setUrls((u) => ({ ...u, [customKey]: customUrl }));
                setCustomKey("");
                setCustomUrl("");
              }}
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Active Links Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(urls)
              .filter(([, v]) => v?.trim())
              .map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-accent">
                    <Globe className="h-3 w-3" />
                    {key}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Badge>
                </a>
              ))}
            {!Object.values(urls).some((v) => v?.trim()) && (
              <span className="text-sm text-muted-foreground">No active social links</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
