import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@/lib/api-extended";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle,
  CreditCard, FileText, Webhook, Shield, Wallet, Settings, Clock, Wifi, WifiOff,
} from "lucide-react";
import type { Notification, NotificationCategory } from "@/lib/types-extended";

const typeIcon: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-info" />,
  success: <CheckCircle className="h-4 w-4 text-success" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
};

const categoryIcon: Record<string, React.ReactNode> = {
  system: <Settings className="h-3.5 w-3.5" />,
  charge: <CreditCard className="h-3.5 w-3.5" />,
  invoice: <FileText className="h-3.5 w-3.5" />,
  webhook: <Webhook className="h-3.5 w-3.5" />,
  security: <Shield className="h-3.5 w-3.5" />,
  wallet: <Wallet className="h-3.5 w-3.5" />,
  admin: <Settings className="h-3.5 w-3.5" />,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { user } = useAuth();

  // Real-time WebSocket with polling fallback
  const { connected, transport } = useNotifications({
    enabled: !!user,
  });

  const { data: countData } = useQuery({
    queryKey: ["notification-count"],
    queryFn: notifications.unreadCount,
    refetchInterval: connected ? false : 30000, // Only poll when WS is disconnected
  });

  const { data: notifData } = useQuery({
    queryKey: ["notifications-drawer"],
    queryFn: () => notifications.list({ per_page: 20 }),
    enabled: open,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notifications.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-drawer"] });
      qc.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-drawer"] });
      qc.invalidateQueries({ queryKey: ["notification-count"] });
      toast.success("All notifications marked as read");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => notifications.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-drawer"] });
      qc.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const count = countData?.count ?? 0;
  const items = notifData?.data ?? [];

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
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => setOpen(true)}>
            <Bell className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {count > 99 ? "99+" : count}
              </span>
            )}
            {/* Connection indicator dot */}
            <span
              className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background ${
                connected ? "bg-success" : "bg-muted-foreground/40"
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {connected ? "Live updates active" : `Polling every ${Math.round(30000 / 1000)}s`}
          </p>
        </TooltipContent>
      </Tooltip>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />Notifications
                {count > 0 && <Badge variant="destructive" className="text-xs">{count}</Badge>}
                {connected ? (
                  <Wifi className="h-3.5 w-3.5 text-success" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </SheetTitle>
              {items.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => markAllMut.mutate()}>
                  <CheckCheck className="mr-1 h-3.5 w-3.5" />Mark all read
                </Button>
              )}
            </div>
            <SheetDescription className="sr-only">Your notifications</SheetDescription>
          </SheetHeader>
          <Separator />
          <ScrollArea className="h-[calc(100vh-80px)]">
            {items.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 transition-colors ${!n.read_at ? "bg-primary/5" : ""} hover:bg-muted/50`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{typeIcon[n.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm">{n.title}</span>
                          {!n.read_at && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                            {categoryIcon[n.category]}{n.category}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />{formatTime(n.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!n.read_at && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markReadMut.mutate(n.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => deleteMut.mutate(n.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
