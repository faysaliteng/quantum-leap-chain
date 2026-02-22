import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "At least one uppercase letter").regex(/[0-9]/, "At least one number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

const passwordChecks = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

export default function Signup() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const result = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { auth: authApi } = await import("@/lib/api-client");
      const res = await authApi.signup({ name, email, password });
      localStorage.setItem("sp_token", res.token);
      localStorage.setItem("sp_user", JSON.stringify(res.user));
      await login({ email, password });
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || "Signup failed. Please try again.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative" data-testid="page:signup">
      <SEOHead title="Create Account" description="Sign up for Cryptoniumpay. Start accepting crypto payments with 0.5% flat fee." />
      <Button variant="ghost" size="sm" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground z-10" asChild>
        <Link to="/"><ArrowLeft className="mr-1.5 h-4 w-4" />{t("auth.backToHome")}</Link>
      </Button>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      <Card className="w-full max-w-sm border-border/50 relative">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <CryptoniumpayLogo size="lg" showText={false} />
          </div>
          <CardTitle className="text-xl font-display">{t("auth.createAccount")}</CardTitle>
          <CardDescription>{t("auth.createAccountDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.fullName")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Jane Doe" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">{t("auth.email")}</Label>
              <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="merchant@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">{t("auth.password")}</Label>
              <div className="relative">
                <Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  {passwordChecks.map((c) => {
                    const pass = c.test(password);
                    return (
                      <div key={c.label} className={`flex items-center gap-1.5 text-xs ${pass ? "text-success" : "text-muted-foreground"}`}>
                        {pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {c.label}
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground font-semibold" disabled={loading}>
              {loading ? t("auth.creating") : t("auth.createBtn")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.haveAccount")}{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">{t("auth.logIn")}</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
