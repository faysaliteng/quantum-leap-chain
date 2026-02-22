import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/lib/auth";
import { auth as authApi } from "@/lib/api-client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";

export default function Login() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });

      // Multi-step auth: email verification first, then 2FA
      if (res.requires_email_verification) {
        navigate("/verify-email", {
          state: { session_token: res.session_token, email, requires_2fa: res.requires_2fa },
          replace: true,
        });
        return;
      }
      if (res.requires_2fa) {
        navigate("/verify-2fa", {
          state: { session_token: res.session_token, email },
          replace: true,
        });
        return;
      }

      // Direct login (no 2FA / email verification)
      loginWithToken(res.token, res.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative">
      <SEOHead title="Sign In" description="Log in to your Cryptoniumpay merchant dashboard." />
      <Button variant="ghost" size="sm" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground z-10" asChild>
        <Link to="/"><ArrowLeft className="mr-1.5 h-4 w-4" />Back to Home</Link>
      </Button>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      <Card className="w-full max-w-sm border-border/50 relative">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <CryptoniumpayLogo size="lg" showText={false} />
          </div>
          <CardTitle className="text-xl font-display">Welcome back</CardTitle>
          <CardDescription>Sign in to your Cryptoniumpay account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="merchant@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground font-semibold" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
