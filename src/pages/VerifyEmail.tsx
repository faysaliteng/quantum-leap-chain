import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/lib/auth";
import { auth as authApi } from "@/lib/api-client";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { loginWithToken } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const sessionToken = (location.state as any)?.session_token;
  const email = (location.state as any)?.email;
  const requires2fa = (location.state as any)?.requires_2fa;

  useEffect(() => {
    if (!sessionToken) navigate("/login", { replace: true });
  }, [sessionToken, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = useCallback(async (value: string) => {
    if (value.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await authApi.verifyEmailCode({ session_token: sessionToken, code: value });
      if (requires2fa || res.requires_2fa) {
        navigate("/verify-2fa", { state: { session_token: res.session_token || sessionToken, email }, replace: true });
      } else {
        loginWithToken(res.token, res.user);
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid verification code");
      setCode("");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, requires2fa, email, navigate, loginWithToken]);

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendEmailCode(sessionToken);
      setResendCooldown(60);
      toast({ title: "Code resent", description: "Check your email for a new verification code." });
    } catch {
      toast({ title: "Failed to resend", description: "Please try again.", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative" data-testid="page:verify-email">
      <SEOHead title="Verify Email" description="Enter the verification code sent to your email." />
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
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl font-display">Check your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <span className="font-medium text-foreground">{email || "your email"}</span>
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
            {loading ? "Verifying…" : "Verify Email"}
          </Button>
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
