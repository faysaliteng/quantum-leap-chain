import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { security } from "@/lib/api-client";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { CopyButton } from "@/components/CopyButton";
import {
  ShieldCheck, ShieldOff, Smartphone, Mail, Key, Monitor, Globe, Trash2,
  AlertTriangle, CheckCircle2, Eye, EyeOff, RefreshCw, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { TwoFactorSetup } from "@/lib/types";

export default function SecuritySettings() {
  usePageTitle("Security Settings");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["security-settings"],
    queryFn: security.getSettings,
  });

  // 2FA setup state
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [setupStep, setSetupStep] = useState<"qr" | "verify" | "backup">("qr");

  // Disable 2FA
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  // Change password
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPwFields, setShowPwFields] = useState(false);

  // Backup codes
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const setup2faMutation = useMutation({
    mutationFn: security.setup2fa,
    onSuccess: (data) => {
      setSetupData(data);
      setSetupStep("qr");
      setShowSetup(true);
    },
  });

  const enable2faMutation = useMutation({
    mutationFn: (code: string) => security.enable2fa(code),
    onSuccess: () => {
      setSetupStep("backup");
      qc.invalidateQueries({ queryKey: ["security-settings"] });
      toast({ title: "2FA Enabled", description: "Your account is now protected with two-factor authentication." });
    },
    onError: () => {
      toast({ title: "Invalid code", description: "Please enter the correct code from your authenticator app.", variant: "destructive" });
      setTotpCode("");
    },
  });

  const disable2faMutation = useMutation({
    mutationFn: (code: string) => security.disable2fa(code),
    onSuccess: () => {
      setShowDisable(false);
      setDisableCode("");
      qc.invalidateQueries({ queryKey: ["security-settings"] });
      toast({ title: "2FA Disabled" });
    },
    onError: () => {
      toast({ title: "Invalid code", variant: "destructive" });
      setDisableCode("");
    },
  });

  const toggleEmailMutation = useMutation({
    mutationFn: security.toggleEmailVerification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security-settings"] });
      toast({ title: "Email verification updated" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) => security.changePassword(data),
    onSuccess: () => {
      setShowPassword(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast({ title: "Password changed successfully" });
    },
    onError: (err: any) => {
      toast({ title: err.response?.data?.message || "Failed to change password", variant: "destructive" });
    },
  });

  const regenerateBackupMutation = useMutation({
    mutationFn: security.regenerateBackupCodes,
    onSuccess: (data) => {
      setBackupCodes(data.backup_codes);
      setShowBackupCodes(true);
      qc.invalidateQueries({ queryKey: ["security-settings"] });
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: security.revokeSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security-settings"] });
      toast({ title: "Session revoked" });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: security.revokeAllSessions,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security-settings"] });
      toast({ title: "All other sessions revoked" });
    },
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading security settings…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Security Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account security, 2FA, and active sessions.</p>
      </div>

      {/* ── Two-Factor Authentication ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${settings?.two_factor_enabled ? "bg-primary/10" : "bg-muted"}`}>
                {settings?.two_factor_enabled ? <ShieldCheck className="h-5 w-5 text-primary" /> : <ShieldOff className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <CardTitle className="text-base">Two-Factor Authentication (2FA)</CardTitle>
                <CardDescription>Use an authenticator app like Google Authenticator or Authy</CardDescription>
              </div>
            </div>
            <Badge variant={settings?.two_factor_enabled ? "default" : "secondary"}>
              {settings?.two_factor_enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {settings?.two_factor_enabled ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Your account is protected with TOTP-based 2FA.</p>
                <p className="mt-1">Backup codes remaining: <span className="font-medium text-foreground">{settings.backup_codes_remaining}</span></p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => regenerateBackupMutation.mutate()}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Regenerate Backup Codes
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDisable(true)}>
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setup2faMutation.mutate()} disabled={setup2faMutation.isPending}>
              <Smartphone className="mr-2 h-4 w-4" />
              {setup2faMutation.isPending ? "Setting up…" : "Enable 2FA"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Email Verification ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Email Verification on Login</CardTitle>
                <CardDescription>Receive a 6-digit code via email every time you log in</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings?.email_verification_enabled ?? true}
              onCheckedChange={(checked) => toggleEmailMutation.mutate(checked)}
              disabled={toggleEmailMutation.isPending}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When enabled, a verification code will be sent to your registered email address on each login attempt.
            This provides an additional layer of security beyond your password.
          </p>
        </CardContent>
      </Card>

      {/* ── Change Password ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Key className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Password</CardTitle>
              <CardDescription>
                {settings?.last_password_change
                  ? `Last changed ${new Date(settings.last_password_change).toLocaleDateString()}`
                  : "Change your account password"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showPwFields ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPw !== confirmPw) return;
                changePasswordMutation.mutate({ current_password: currentPw, new_password: newPw });
              }}
              className="space-y-4 max-w-sm"
            >
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
                {confirmPw && newPw !== confirmPw && <p className="text-xs text-destructive">Passwords don't match</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={changePasswordMutation.isPending || newPw !== confirmPw}>
                  {changePasswordMutation.isPending ? "Changing…" : "Change Password"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setShowPwFields(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setShowPwFields(true)}>Change Password</Button>
          )}
        </CardContent>
      </Card>

      {/* ── Active Sessions ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Monitor className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Active Sessions</CardTitle>
                <CardDescription>Devices currently logged into your account</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => revokeAllMutation.mutate()} disabled={revokeAllMutation.isPending}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />Revoke All Others
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(settings?.active_sessions ?? []).map((session) => (
              <div key={session.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{session.device}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.ip_address}{session.location ? ` · ${session.location}` : ""} · {session.last_active}
                    </p>
                  </div>
                  {session.current && <Badge variant="secondary" className="text-xs">Current</Badge>}
                </div>
                {!session.current && (
                  <Button variant="ghost" size="icon" onClick={() => revokeSessionMutation.mutate(session.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {(!settings?.active_sessions || settings.active_sessions.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">No active sessions found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 2FA Setup Dialog ── */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {setupStep === "qr" && "Scan QR Code"}
              {setupStep === "verify" && "Verify Code"}
              {setupStep === "backup" && "Save Backup Codes"}
            </DialogTitle>
            <DialogDescription>
              {setupStep === "qr" && "Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)"}
              {setupStep === "verify" && "Enter the 6-digit code shown in your authenticator app"}
              {setupStep === "backup" && "Save these backup codes in a secure place. Each code can only be used once."}
            </DialogDescription>
          </DialogHeader>

          {setupStep === "qr" && setupData && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={setupData.qr_code_data_url} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Manual entry key</Label>
                <div className="flex items-center gap-2 bg-muted rounded-md p-2">
                  <code className="text-xs font-mono flex-1 break-all">{setupData.secret}</code>
                  <CopyButton value={setupData.secret} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setSetupStep("verify")} className="w-full">I've scanned the code</Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === "verify" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={totpCode} onChange={(v) => { setTotpCode(v); if (v.length === 6) enable2faMutation.mutate(v); }}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <span className="text-muted-foreground text-2xl">–</span>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => enable2faMutation.mutate(totpCode)}
                  disabled={totpCode.length !== 6 || enable2faMutation.isPending}
                  className="w-full"
                >
                  {enable2faMutation.isPending ? "Verifying…" : "Enable 2FA"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === "backup" && setupData && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backup_codes.map((code, i) => (
                    <code key={i} className="text-sm font-mono text-center py-1 px-2 bg-background rounded border border-border">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded-md p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Store these codes securely. They won't be shown again. Each code can only be used once as a backup if you lose access to your authenticator app.</p>
              </div>
              <DialogFooter>
                <CopyButton value={setupData.backup_codes.join("\n")} className="mr-auto" />
                <Button onClick={() => { setShowSetup(false); setSetupData(null); setTotpCode(""); setSetupStep("qr"); }}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Disable 2FA Dialog ── */}
      <AlertDialog open={showDisable} onOpenChange={setShowDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove 2FA protection from your account. Enter your authenticator code to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={disableCode} onChange={setDisableCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <span className="text-muted-foreground text-2xl">–</span>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisableCode("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disable2faMutation.mutate(disableCode)}
              disabled={disableCode.length !== 6 || disable2faMutation.isPending}
              className="bg-destructive text-destructive-foreground"
            >
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Backup Codes Dialog ── */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Backup Codes</DialogTitle>
            <DialogDescription>Your previous backup codes have been invalidated. Save these new ones securely.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono text-center py-1 px-2 bg-background rounded border border-border">
                  {code}
                </code>
              ))}
            </div>
          </div>
          <DialogFooter>
            <CopyButton value={backupCodes.join("\n")} className="mr-auto" />
            <Button onClick={() => setShowBackupCodes(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
