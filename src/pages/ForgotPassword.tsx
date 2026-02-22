import { useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { auth as authApi } from "@/lib/api-client";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative" data-testid="page:forgot-password">
      <SEOHead title="Forgot Password" description="Reset your Cryptoniumpay account password." />
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
          <CardTitle className="text-xl font-display">
            {submitted ? "Check Your Email" : "Forgot Password"}
          </CardTitle>
          <CardDescription>
            {submitted
              ? "If an account with that email exists, we've sent password reset instructions."
              : "Enter your email address and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-success/10 p-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                The link will expire in 30 minutes. Check your spam folder if you don't see it.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => setSubmitted(false)} className="w-full">
                  <Mail className="mr-1.5 h-4 w-4" />Try Another Email
                </Button>
                <Button asChild className="w-full">
                  <Link to="/login">Return to Login</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="merchant@example.com"
                  maxLength={255}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground font-semibold" disabled={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
