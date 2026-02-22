import { useState } from "react";
import { useLocation } from "react-router-dom";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@/lib/api-extended";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import {
  Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle,
  CreditCard, FileText, Webhook, Shield, Wallet, Settings, Clock, Mail, Filter,
} from "lucide-react";
import type { NotificationCategory } from "@/lib/types-extended";

const typeIcon: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-info" />,
  success: <CheckCircle className="h-4 w-4 text-success" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
};

const categories: { key: NotificationCategory; label: string; icon: React.ReactNode }[] = [
  { key: "system", label: "System", icon: <Settings className="h-4 w-4" /> },
  { key: "charge", label: "Charges", icon: <CreditCard className="h-4 w-4" /> },
  { key: "invoice", label: "Invoices", icon: <FileText className="h-4 w-4" /> },
  { key: "webhook", label: "Webhooks", icon: <Webhook className="h-4 w-4" /> },
  { key: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { key: "wallet", label: "Wallet", icon: <Wallet className="h-4 w-4" /> },
];

export default function NotificationsPage() {
  const { t } = useI18n();
  usePageTitle(t("notifications.title"));
  const location = useLocation();
  const qc = useQueryClient();
  const [filterCat, setFilterCat] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-page", filterCat],
    queryFn: () => notifications.list({
      category: filterCat !== "all" ? filterCat : undefined,
      per_page: 50,
    }),
  });

  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: notifications.getPreferences,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notifications.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-page"] });
      qc.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-page"] });
      qc.invalidateQueries({ queryKey: ["notification-count"] });
      toast.success("All marked as read");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => notifications.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-page"] });
      qc.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const updatePrefsMut = useMutation({
    mutationFn: (data: any) => notifications.updatePreferences(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-prefs"] });
      toast.success("Preferences saved");
    },
  });

  if (isLoading) return <PageSkeleton />;

  const items = data?.data ?? [];

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6" data-testid={location.pathname.startsWith("/admin") ? "page:admin-notifications" : "page:dashboard-notifications"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">{t("notifications.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("notifications.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending}>
          <CheckCheck className="mr-1.5 h-4 w-4" />Mark All Read
        </Button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox ({items.length})</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4 mt-4">
          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button variant={filterCat === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterCat("all")}
              className={filterCat === "all" ? "bg-gradient-gold text-primary-foreground" : ""}>
              All
            </Button>
            {categories.map((c) => (
              <Button key={c.key} variant={filterCat === c.key ? "default" : "outline"} size="sm" onClick={() => setFilterCat(c.key)}
                className={filterCat === c.key ? "bg-gradient-gold text-primary-foreground" : ""}>
                {c.icon}<span className="ml-1">{c.label}</span>
              </Button>
            ))}
          </div>

          {/* Notification List */}
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((n) => (
                <Card key={n.id} className={`transition-colors ${!n.read_at ? "border-primary/30 bg-primary/5" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{typeIcon[n.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm">{n.title}</span>
                          {!n.read_at && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{n.body}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{n.category}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{formatTime(n.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.read_at && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markReadMut.mutate(n.id)} title="Mark read">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(n.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notification Preferences</CardTitle>
              <CardDescription>Choose which notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                  </div>
                </div>
                <Switch
                  checked={prefs?.email_enabled ?? true}
                  onCheckedChange={(v) => updatePrefsMut.mutate({ email_enabled: v })}
                />
              </div>
              <Separator />
              <p className="text-sm font-medium">Categories</p>
              {categories.map((c) => (
                <div key={c.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {c.icon}
                    <span className="text-sm">{c.label}</span>
                  </div>
                  <Switch
                    checked={prefs?.categories_enabled?.includes(c.key) ?? true}
                    onCheckedChange={(v) => {
                      const current = prefs?.categories_enabled ?? categories.map((x) => x.key);
                      const updated = v ? [...current, c.key] : current.filter((x) => x !== c.key);
                      updatePrefsMut.mutate({ categories_enabled: updated });
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
