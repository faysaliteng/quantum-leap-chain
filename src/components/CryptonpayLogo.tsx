import { Bitcoin } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: "h-7 w-7", icon: "h-3.5 w-3.5", text: "text-sm" },
  md: { box: "h-9 w-9", icon: "h-5 w-5", text: "text-base" },
  lg: { box: "h-11 w-11", icon: "h-6 w-6", text: "text-xl" },
  xl: { box: "h-14 w-14", icon: "h-8 w-8", text: "text-2xl" },
};

export function CryptonpayLogo({ size = "md", showText = true, className = "" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${s.box} flex items-center justify-center rounded-xl bg-gradient-gold glow-gold`}>
        <Bitcoin className={`${s.icon} text-primary-foreground`} strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={`${s.text} font-display font-bold tracking-tight`}>
          Crypton<span className="text-gradient-gold">pay</span>
        </span>
      )}
    </div>
  );
}
