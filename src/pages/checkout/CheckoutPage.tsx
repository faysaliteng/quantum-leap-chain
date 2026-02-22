import { useParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { checkout } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import type { ChainId, AssetSymbol } from "@/lib/types";

export default function CheckoutPage() {
  const { chargeId } = useParams<{ chargeId: string }>();
  const { data: charge, refetch } = useQuery({
    queryKey: ["checkout", chargeId],
    queryFn: () => checkout.getCharge(chargeId!),
    refetchInterval: 4000,
  });

  const addressEntries = Object.entries(charge?.addresses ?? {});
  const [selected, setSelected] = useState(0);
  const selectedAddr = addressEntries[selected]?.[1];

  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!charge) return;
    const interval = setInterval(() => {
      const diff = new Date(charge.expires_at).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [charge]);

  if (!charge) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const isPaid = charge.status === "PAID" || charge.status === "CONFIRMED";
  const isExpired = charge.status === "EXPIRED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4" data-testid="page:checkout">
      <SEOHead title={`Pay ${charge.name}`} description="Complete your crypto payment securely." noindex />
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="pt-6 space-y-6">
          <div className="flex justify-center">
            <CryptoniumpayLogo size="sm" />
          </div>

          <div className="text-center">
            <h1 className="text-lg font-display font-semibold">{charge.name}</h1>
            {charge.description && <p className="text-sm text-muted-foreground mt-1">{charge.description}</p>}
            {charge.local_price && <p className="text-3xl font-display font-bold mt-3 text-gradient-gold">{charge.local_price.amount} {charge.local_price.currency}</p>}
            <div className="mt-3"><StatusBadge status={charge.status} /></div>
          </div>

          {isPaid && (
            <div className="text-center space-y-2 py-4">
              <CheckCircle className="h-14 w-14 mx-auto text-success" />
              <p className="text-lg font-display font-semibold text-success">Payment Complete</p>
              {charge.redirect_url && <Button asChild className="mt-2 bg-gradient-gold text-primary-foreground"><a href={charge.redirect_url}>Continue</a></Button>}
            </div>
          )}

          {isExpired && (
            <div className="text-center space-y-2 py-4">
              <AlertTriangle className="h-14 w-14 mx-auto text-warning" />
              <p className="text-lg font-display font-medium">This charge has expired</p>
            </div>
          )}

          {!isPaid && !isExpired && (
            <>
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Expires in <span className="font-mono font-medium text-foreground">{timeLeft}</span></span>
              </div>

              {addressEntries.length > 1 && (
                <div className="flex gap-1 justify-center flex-wrap">
                  {addressEntries.map(([key, addr], i) => (
                    <Button key={key} variant={selected === i ? "default" : "outline"} size="sm" className={`text-xs h-7 ${selected === i ? "bg-gradient-gold text-primary-foreground" : ""}`} onClick={() => setSelected(i)}>
                      {addr.asset} ({addr.chain})
                    </Button>
                  ))}
                </div>
              )}

              {selectedAddr && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-foreground p-3 rounded-xl">
                      <QRCodeSVG value={selectedAddr.address} size={180} bgColor="transparent" fgColor="hsl(var(--background))" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Send exactly</p>
                      <p className="text-xl font-mono font-bold">{selectedAddr.amount} {selectedAddr.asset}</p>
                    </div>

                    <div className="flex items-center gap-1 bg-muted rounded-lg px-3 py-2">
                      <span className="text-xs font-mono truncate flex-1">{selectedAddr.address}</span>
                      <CopyButton value={selectedAddr.address} />
                    </div>
                  </div>

                  {(charge.status === "PENDING" || charge.status === "UNDERPAID") && (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-muted-foreground">
                        {charge.status === "UNDERPAID" ? "Underpaid — send remaining amount" : "Detecting payment…"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
