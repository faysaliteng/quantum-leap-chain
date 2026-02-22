import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import { PlusCircle, Trash2, Megaphone, Eye } from "lucide-react";
import type { Announcement } from "@/lib/types";

export default function AnnouncementManager() {
  usePageTitle("Announcements");
  const qc = useQueryClient();

  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "promo">("info");

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["cms-announcements"],
    queryFn: admin.cms.announcements.list,
  });

  const createMut = useMutation({
    mutationFn: () => admin.cms.announcements.create({ message, type, active: true, start_date: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-announcements"] }); setMessage(""); toast.success("Announcement created"); },
    onError: () => toast.error("Failed to create announcement"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => admin.cms.announcements.update(id, { active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-announcements"] }); toast.success("Updated"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => admin.cms.announcements.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-announcements"] }); toast.success("Deleted"); },
  });

  if (isLoading) return <PageSkeleton />;

  const typeColors: Record<string, string> = {
    info: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]",
    warning: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
    promo: "bg-primary/10 text-primary",
  };

  return (
    <div className="space-y-6" data-testid="page:admin-cms-announcements">
      <h1 className="text-lg font-semibold">Announcement Banners</h1>

      {/* Create Form */}
      <Card>
        <CardHeader><CardTitle className="text-sm">New Announcement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="msg">Message</Label>
              <Input id="msg" placeholder="Enter announcement message..." value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="promo">Promo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => createMut.mutate()} disabled={!message.trim() || createMut.isPending}>
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />Create
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          {message.trim() && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />Preview</Label>
              <div className={`rounded-lg px-4 py-2.5 text-sm font-medium ${typeColors[type]}`}>
                <Megaphone className="inline h-3.5 w-3.5 mr-2" />{message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Active & Past Announcements</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements?.length ? announcements.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-2 max-w-xs truncate">{a.message}</td>
                  <td className="px-4 py-2"><Badge variant="outline" className="text-xs font-mono">{a.type}</Badge></td>
                  <td className="px-4 py-2">
                    <Badge variant={a.active ? "default" : "secondary"} className="text-xs">{a.active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleMut.mutate({ id: a.id, active: !a.active })}>
                      {a.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMut.mutate(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No announcements yet</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
