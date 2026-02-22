import { Button } from "@/components/ui/button";

const RANGES = ["1D", "7D", "1M", "3M", "1Y", "ALL"] as const;
export type TimeRange = typeof RANGES[number];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1">
      {RANGES.map((r) => (
        <Button
          key={r}
          variant={value === r ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2.5 text-xs font-mono"
          onClick={() => onChange(r)}
        >
          {r}
        </Button>
      ))}
    </div>
  );
}
