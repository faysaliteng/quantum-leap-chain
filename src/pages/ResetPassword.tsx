import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useI18n } from "@/lib/i18n";
import { auth as authApi } from "@/lib/api-client";
import { ArrowLeft, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  if (score < 40) return { score, label: "Weak", color: "bg-destructive" };
  if (score < 70) return { score, label: "Fair", color: "bg-warning" };
  if (score < 90) return { score, label: "Good", color: "bg-info" };
  return { score, label: "Strong", color: "bg-success" };
}

export default function ResetPassword() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const mismatch = confirm.length > 0 && password !== confirm;
  const valid = password.length >= 12 && !mismatch && token.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword({ token, new_password: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Reset link is invalid or expired. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" data-testid="page:reset-password">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">{t("auth.invalidResetLink")}</p>
            <Button asChild><Link to="/forgot-password">{t("auth.requestNewLink")}</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative" data-testid="page:reset-password">
      <SEOHead title="Reset Password" description="Set a new password for your Cryptoniumpay account." />
      <Button variant="ghost" size="sm" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground z-10" asChild>
        <Link to="/login"><ArrowLeft className="mr-1.5 h-4 w-4" />{t("auth.backToLogin")}</Link>
      </Button>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      <Card className="w-full max-w-sm border-border/50 relative">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <CryptoniumpayLogo size="lg" showText={false} />
          </div>
          <CardTitle className="text-xl font-display">
            {success ? t("auth.resetSuccess") : t("auth.setNewPassword")}
          </CardTitle>
          <CardDescription>
            {success ? t("auth.resetSuccessDesc") : t("auth.setNewPasswordDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{t("auth.sessionsRevoked")}</p>
              <Button asChild className="w-full bg-gradient-gold text-primary-foreground font-semibold">
                <Link to="/login">{t("auth.signIn")}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder={t("auth.minChars")}
                    minLength={12}
                    maxLength={128}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {password && (
                  <div className="space-y-1">
                    <Progress value={strength.score} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{t("auth.strength")}: <span className="font-medium">{strength.label}</span></p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder={t("auth.reenterPassword")}
                />
                {mismatch && <p className="text-xs text-destructive">{t("auth.passwordsNoMatch")}</p>}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{t("auth.passwordRequirements")}</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li className={password.length >= 12 ? "text-success" : ""}>{t("auth.req12chars")}</li>
                  <li className={/[A-Z]/.test(password) ? "text-success" : ""}>{t("auth.reqUppercase")}</li>
                  <li className={/[0-9]/.test(password) ? "text-success" : ""}>{t("auth.reqNumber")}</li>
                  <li className={/[^A-Za-z0-9]/.test(password) ? "text-success" : ""}>{t("auth.reqSpecial")}</li>
                </ul>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground font-semibold" disabled={loading || !valid}>
                {loading ? t("auth.resetting") : t("auth.resetPassword")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
