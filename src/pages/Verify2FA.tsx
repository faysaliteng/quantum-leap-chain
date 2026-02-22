import { useState, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/lib/auth";
import { auth as authApi } from "@/lib/api-client";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Verify2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);

  const sessionToken = (location.state as any)?.session_token;

  const handleVerify = useCallback(async (value: string) => {
    if (value.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await authApi.verify2fa({ session_token: sessionToken, totp_code: value });
      loginWithToken(res.token, res.user);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid authenticator code");
      setCode("");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, navigate, loginWithToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative">
      <SEOHead title="Two-Factor Authentication" description="Enter your authenticator code to continue." />
      <Button variant="ghost" size="sm" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground z-10" asChild>
        <Link to="/login"><ArrowLeft className="mr-1.5 h-4 w-4" />Back to Login</Link>
      </Button>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      <Card className="w-full max-w-sm border-border/50 relative">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <CryptoniumpayLogo size="lg" showText={false} />
          </div>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl font-display">Two-Factor Authentication</CardTitle>
          <CardDescription>
            {useBackup
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); if (v.length === 6) handleVerify(v); }}>
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
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button
            onClick={() => handleVerify(code)}
            className="w-full bg-gradient-gold text-primary-foreground font-semibold"
            disabled={loading || code.length !== 6}
          >
            {loading ? "Verifying…" : "Verify"}
          </Button>
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setUseBackup(!useBackup); setCode(""); setError(""); }}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              {useBackup ? "Use authenticator app" : "Use a backup code instead"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
