import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import { Globe, Eye, EyeOff } from "lucide-react";

export default function PageManager() {
  const { t } = useI18n();
  usePageTitle(t("cms.pages"));
  const qc = useQueryClient();

  const { data: pages, isLoading } = useQuery({
    queryKey: ["cms-pages"],
    queryFn: admin.cms.pages.list,
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "published" | "draft" }) =>
      admin.cms.pages.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-pages"] }); toast.success(t("cms.pageUpdated")); },
    onError: () => toast.error(t("admin.failed")),
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6" data-testid="page:admin-cms-pages">
      <h1 className="text-lg font-semibold">{t("cms.pages")}</h1>
      <p className="text-sm text-muted-foreground">{t("cms.seoMetadata")}</p>

      <div className="grid gap-4">
        {pages?.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.title}</span>
                    <Badge variant={p.status === "published" ? "default" : "secondary"} className="text-xs">
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">/{p.slug}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">{p.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {p.og_image ? `✓ ${t("cms.ogImage")}` : `✗ ${t("cms.noOgImage")}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMut.mutate({ id: p.id, status: p.status === "published" ? "draft" : "published" })}
                >
                  {p.status === "published" ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" />{t("cms.unpublish")}</> : <><Eye className="mr-1.5 h-3.5 w-3.5" />{t("cms.publish")}</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )) ?? (
          <div className="text-center py-8 text-muted-foreground">{t("cms.noPages")}</div>
        )}
      </div>
    </div>
  );
}