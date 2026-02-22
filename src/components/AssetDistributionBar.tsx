import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CHAIN_COLORS } from "@/lib/constants";

interface AssetHolding {
  symbol: string;
  percentage: number;
  amount: string;
  usd_value: string;
}

interface AssetDistributionBarProps {
  holdings: AssetHolding[];
}

export function AssetDistributionBar({ holdings }: AssetDistributionBarProps) {
  return (
    <div className="space-y-3">
      <div className="h-4 rounded-full overflow-hidden flex bg-muted">
        {holdings.map((h) => (
          <Tooltip key={h.symbol}>
            <TooltipTrigger asChild>
              <div
                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${Math.max(h.percentage, 1)}%`,
                  backgroundColor: CHAIN_COLORS[h.symbol] || "hsl(var(--muted-foreground))",
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">{h.symbol}: {h.amount} (${h.usd_value})</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {holdings.map((h) => (
          <div key={h.symbol} className="flex items-center gap-1.5 text-xs">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHAIN_COLORS[h.symbol] || "hsl(var(--muted-foreground))" }} />
            <span className="font-mono font-medium">{h.symbol}</span>
            <span className="text-muted-foreground">{h.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
