import logoIcon from "@/assets/logo-icon.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: "h-7 w-7", text: "text-sm" },
  md: { box: "h-9 w-9", text: "text-base" },
  lg: { box: "h-11 w-11", text: "text-xl" },
  xl: { box: "h-14 w-14", text: "text-2xl" },
};

export function CryptoniumpayLogo({ size = "md", showText = true, className = "" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src={logoIcon} alt="Cryptoniumpay" className={`${s.box} rounded-lg object-contain`} />
      {showText && (
        <span className={`${s.text} font-display font-bold tracking-tight`}>
          Cryptonium<span className="text-gradient-gold">pay</span>
        </span>
      )}
    </div>
  );
}
