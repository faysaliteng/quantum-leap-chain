import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText, PlusCircle, Megaphone, HelpCircle, Newspaper, Settings,
  ArrowRight, Activity, Mail, Share2,
} from "lucide-react";

export default function CMSDashboard() {
  const { t } = useI18n();
  usePageTitle(t("cms.dashboard"));

  const { data: stats, isLoading } = useQuery({
    queryKey: ["cms-stats"],
    queryFn: admin.cms.stats,
  });

  if (isLoading) return <PageSkeleton />;

  const cards = [
    { label: "Pages", value: stats?.total_pages ?? 0, icon: FileText, to: "/admin/cms/pages", color: "text-info" },
    { label: "Blog Posts", value: stats?.total_posts ?? 0, icon: Newspaper, to: "/admin/cms/blog", color: "text-success" },
    { label: "Announcements", value: stats?.total_announcements ?? 0, icon: Megaphone, to: "/admin/cms/announcements", color: "text-warning" },
    { label: "FAQ Entries", value: stats?.total_faqs ?? 0, icon: HelpCircle, to: "/admin/cms/faq", color: "text-primary" },
    { label: "Contact Inbox", value: stats?.total_contacts ?? 0, icon: Mail, to: "/admin/cms/contacts", color: "text-destructive", badge: stats?.unread_contacts },
    { label: "Social Links", value: "Manage", icon: Share2, to: "/admin/cms/social", color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6" data-testid="page:admin-cms">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("cms.dashboard")}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/cms/settings"><Settings className="mr-1.5 h-3.5 w-3.5" />CMS Settings</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase">{c.label}</CardTitle>
                <div className="flex items-center gap-2">
                  {"badge" in c && c.badge ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{c.badge} new</Badge>
                  ) : null}
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{c.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "New Blog Post", icon: PlusCircle, to: "/admin/cms/blog", desc: "Write a new article or guide" },
          { label: "New Announcement", icon: Megaphone, to: "/admin/cms/announcements", desc: "Create a site-wide banner" },
          { label: "New FAQ", icon: HelpCircle, to: "/admin/cms/faq", desc: "Add a new FAQ entry" },
          { label: "Manage Social", icon: Share2, to: "/admin/cms/social", desc: "Edit social media links" },
        ].map((a) => (
          <Link key={a.label} to={a.to}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <a.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{a.label}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Content Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {stats?.recent_activity?.length ? stats.recent_activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs font-mono">{a.type}</Badge>
                  <span>{a.title}</span>
                  <span className="text-muted-foreground">— {a.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
