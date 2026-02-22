import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRoles } from "@/lib/api-extended";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageSkeleton } from "@/components/PageSkeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Shield, Users, Plus, Trash2, Edit, UserPlus, Key, Check, Mail, Clock,
  Wallet, Settings, FileText, BarChart3, Activity, Lock, Eye, ShieldCheck,
} from "lucide-react";
import type { AdminPermission, AdminRole } from "@/lib/types-extended";

const allPermissions: { group: string; perms: { key: AdminPermission; label: string; icon: React.ReactNode }[] }[] = [
  {
    group: "Wallets", perms: [
      { key: "wallets.view", label: "View wallets", icon: <Eye className="h-3.5 w-3.5" /> },
      { key: "wallets.withdraw", label: "Initiate withdrawals", icon: <Wallet className="h-3.5 w-3.5" /> },
      { key: "wallets.approve", label: "Approve withdrawals", icon: <Check className="h-3.5 w-3.5" /> },
    ],
  },
  {
    group: "Finance", perms: [
      { key: "fees.view", label: "View fees", icon: <Eye className="h-3.5 w-3.5" /> },
      { key: "fees.edit", label: "Edit fees", icon: <Edit className="h-3.5 w-3.5" /> },
      { key: "revenue.view", label: "View revenue", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    ],
  },
  {
    group: "Infrastructure", perms: [
      { key: "chains.view", label: "View chains", icon: <Eye className="h-3.5 w-3.5" /> },
      { key: "chains.edit", label: "Edit chains", icon: <Settings className="h-3.5 w-3.5" /> },
      { key: "monitoring.view", label: "View monitoring", icon: <Activity className="h-3.5 w-3.5" /> },
    ],
  },
  {
    group: "Content", perms: [
      { key: "cms.view", label: "View CMS", icon: <Eye className="h-3.5 w-3.5" /> },
      { key: "cms.edit", label: "Edit CMS", icon: <FileText className="h-3.5 w-3.5" /> },
    ],
  },
  {
    group: "Users", perms: [
      { key: "merchants.view", label: "View merchants", icon: <Eye className="h-3.5 w-3.5" /> },
      { key: "merchants.manage", label: "Manage merchants", icon: <Users className="h-3.5 w-3.5" /> },
    ],
  },
  {
    group: "Security", perms: [
      { key: "audit.view", label: "View audit log", icon: <FileText className="h-3.5 w-3.5" /> },
      { key: "security.view", label: "View security policies", icon: <Shield className="h-3.5 w-3.5" /> },
      { key: "security.edit", label: "Edit security policies", icon: <Lock className="h-3.5 w-3.5" /> },
      { key: "roles.view", label: "View roles", icon: <Eye className="h-3.5 w-3.5" /> },
      { key: "roles.manage", label: "Manage roles", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
      { key: "notifications.manage", label: "Manage notifications", icon: <Settings className="h-3.5 w-3.5" /> },
    ],
  },
];

export default function AdminRoleManagement() {
  const { t } = useI18n();
  usePageTitle(t("admin.roles"));
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editRole, setEditRole] = useState<AdminRole | null>(null);
  const [form, setForm] = useState({ name: "", description: "", permissions: [] as AdminPermission[] });
  const [inviteForm, setInviteForm] = useState({ email: "", role_id: "" });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: adminRoles.list,
  });

  const { data: assignments } = useQuery({
    queryKey: ["admin-role-assignments"],
    queryFn: adminRoles.assignments,
  });

  const { data: invites } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: adminRoles.invites,
  });

  const createMut = useMutation({
    mutationFn: () => adminRoles.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      setShowCreate(false);
      setForm({ name: "", description: "", permissions: [] });
      toast.success(t("admin.createRole"));
    },
    onError: () => toast.error(t("admin.failed")),
  });

  const updateMut = useMutation({
    mutationFn: () => editRole ? adminRoles.update(editRole.id, { name: form.name, description: form.description, permissions: form.permissions }) : Promise.reject(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      setEditRole(null);
      toast.success(t("admin.updateRole"));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminRoles.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success(t("common.delete"));
    },
  });

  const inviteMut = useMutation({
    mutationFn: () => adminRoles.sendInvite(inviteForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      setShowInvite(false);
      setInviteForm({ email: "", role_id: "" });
      toast.success(t("admin.sendInvite"));
    },
    onError: () => toast.error(t("admin.failed")),
  });

  const revokeInviteMut = useMutation({
    mutationFn: (id: string) => adminRoles.revokeInvite(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-invites"] }); toast.success(t("admin.revoke")); },
  });

  if (rolesLoading) return <PageSkeleton />;

  const togglePerm = (perm: AdminPermission) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter((p) => p !== perm) : [...f.permissions, perm],
    }));
  };

  return (
    <div className="space-y-6" data-testid="page:admin-roles">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />{t("admin.roles")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("admin.rbacDesc")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowInvite(true)}><UserPlus className="mr-1.5 h-3.5 w-3.5" />{t("admin.inviteTeamMember")}</Button>
          <Button onClick={() => { setForm({ name: "", description: "", permissions: [] }); setShowCreate(true); }}><Plus className="mr-1.5 h-3.5 w-3.5" />{t("admin.createRole")}</Button>
        </div>
      </div>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">{t("admin.roles_tab")} ({roles?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="team">{t("admin.teamMembers")} ({assignments?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="invites">{t("admin.invites")} ({invites?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-3 mt-4">
          {(roles ?? []).map((role) => (
            <Card key={role.id} className={role.is_system ? "border-primary/20" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{role.name}</span>
                      {role.is_system && <Badge variant="outline" className="text-xs">{t("admin.system")}</Badge>}
                      <Badge variant="secondary" className="text-xs">{role.permissions.length} {t("admin.permissions")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {role.permissions.slice(0, 8).map((p) => (
                        <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                      ))}
                      {role.permissions.length > 8 && <Badge variant="outline" className="text-[10px]">+{role.permissions.length - 8} {t("admin.more")}</Badge>}
                    </div>
                  </div>
                  {!role.is_system && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => { setEditRole(role); setForm({ name: role.name, description: role.description, permissions: role.permissions }); }}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(role.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="team" className="space-y-3 mt-4">
          {(assignments ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm"><Users className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>{t("admin.noTeamMembers")}</p></div>
          ) : (
            (assignments ?? []).map((a) => (
              <Card key={a.admin_user_id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {a.admin_email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.admin_email}</p>
                      <p className="text-xs text-muted-foreground">{t("admin.assigned")}: {new Date(a.assigned_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{a.role_name}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="invites" className="space-y-3 mt-4">
          {(invites ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm"><Mail className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>{t("admin.noPendingInvites")}</p></div>
          ) : (
            (invites ?? []).map((inv) => (
              <Card key={inv.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{inv.role_name}</Badge>
                      <Badge className={inv.status === "pending" ? "bg-warning/10 text-warning border-0 text-xs" : inv.status === "accepted" ? "bg-success/10 text-success border-0 text-xs" : "bg-muted text-muted-foreground border-0 text-xs"}>{inv.status}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{t("admin.expires")}: {new Date(inv.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {inv.status === "pending" && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revokeInviteMut.mutate(inv.id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" />{t("admin.revoke")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Role Dialog */}
      <Dialog open={showCreate || !!editRole} onOpenChange={(v) => { if (!v) { setShowCreate(false); setEditRole(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRole ? t("admin.editRole") : t("admin.createRole")}</DialogTitle>
            <DialogDescription>{t("admin.roleNameDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("admin.roleName")}</Label>
                <Input placeholder="e.g. Treasury Manager" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.description")}</Label>
                <Input placeholder="Short description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <Separator />
            <p className="text-sm font-medium">{t("admin.permissionMatrix")}</p>
            {allPermissions.map((group) => (
              <div key={group.group}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{group.group}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.perms.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox checked={form.permissions.includes(p.key)} onCheckedChange={() => togglePerm(p.key)} />
                      <span className="text-muted-foreground">{p.icon}</span>
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditRole(null); }}>{t("common.cancel")}</Button>
            <Button onClick={() => editRole ? updateMut.mutate() : createMut.mutate()} disabled={!form.name.trim() || createMut.isPending || updateMut.isPending}>
              {editRole ? t("admin.updateRole") : t("admin.createRole")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("admin.inviteTeamMember")}</DialogTitle>
            <DialogDescription>{t("admin.inviteDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.emailAddress")}</Label>
              <Input type="email" placeholder="admin@company.com" value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.assignRole")}</Label>
              <Select value={inviteForm.role_id} onValueChange={(v) => setInviteForm((f) => ({ ...f, role_id: v }))}>
                <SelectTrigger><SelectValue placeholder={t("admin.selectRole")} /></SelectTrigger>
                <SelectContent>
                  {(roles ?? []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>{t("common.cancel")}</Button>
            <Button onClick={() => inviteMut.mutate()} disabled={!inviteForm.email || !inviteForm.role_id || inviteMut.isPending}>
              <Mail className="mr-1.5 h-4 w-4" />{t("admin.sendInvite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
