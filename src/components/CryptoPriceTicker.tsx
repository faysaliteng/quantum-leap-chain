import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  sparkline_in_7d: { price: number[] };
  image: string;
  market_cap: number;
  total_volume: number;
}

const COINS = "bitcoin,ethereum,tether,usd-coin,binancecoin,ripple,solana,cardano,dogecoin,polygon-ecosystem-token";

async function fetchCryptoPrices(): Promise<CoinData[]> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS}&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h`
  );
  if (!res.ok) throw new Error("Failed to fetch prices");
  return res.json();
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
  return `$${vol.toLocaleString()}`;
}

function SparklineChart({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  // Sample to ~30 points for performance
  const step = Math.max(1, Math.floor(data.length / 30));
  const sampled = data.filter((_, i) => i % step === 0).map((price, i) => ({ i, price }));
  const color = isPositive ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 51%)";

  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={sampled}>
        <defs>
          <linearGradient id={`gradient-${isPositive ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#gradient-${isPositive ? "up" : "down"})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CryptoPriceTicker() {
  const { data: coins, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["crypto-prices"],
    queryFn: fetchCryptoPrices,
    refetchInterval: 60000, // every 60s
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="border-border/50 animate-pulse">
            <CardContent className="pt-4 pb-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-2 w-10 bg-muted rounded" />
                </div>
              </div>
              <div className="h-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !coins) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground mb-2">Unable to load live prices</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold">Live Market Data</h2>
          <p className="text-muted-foreground text-sm mt-1">Real-time crypto prices · Auto-refreshes every 60s</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
          </span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {coins.map((coin) => {
          const isPositive = coin.price_change_percentage_24h >= 0;
          const changePercent = Math.abs(coin.price_change_percentage_24h).toFixed(2);

          return (
            <Card key={coin.id} className="border-border/50 bg-card/80 hover:border-primary/30 transition-all duration-300 group overflow-hidden">
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="h-7 w-7 rounded-full"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-sm font-semibold leading-tight">{coin.symbol.toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{coin.name}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-mono font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : coin.price_change_percentage_24h === 0 ? <Minus className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {changePercent}%
                  </div>
                </div>

                <div className="h-12">
                  <SparklineChart data={coin.sparkline_in_7d.price} isPositive={isPositive} />
                </div>

                <div className="flex items-end justify-between">
                  <p className="text-lg font-display font-bold leading-tight">{formatPrice(coin.current_price)}</p>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground leading-tight">MCap {formatMarketCap(coin.market_cap)}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Vol {formatVolume(coin.total_volume)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
