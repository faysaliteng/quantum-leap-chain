/**
 * Professional SVG icons for wallet providers and hardware wallets.
 * Replaces emojis with clean, branded iconography.
 */

interface WalletProviderIconProps {
  provider: string;
  size?: number;
  className?: string;
}

const providerIcons: Record<string, { bg: string; content: JSX.Element }> = {
  metamask: {
    bg: "#F6851B",
    content: (
      <path d="M25.3 5.9l-8.1 6 1.5-3.6 6.6-2.4zM6.7 5.9l8 6.1-1.4-3.7-6.6-2.4zM22.4 20.8l-2.2 3.3 4.6 1.3 1.3-4.5-3.7-.1zM5.9 20.9l1.3 4.5 4.6-1.3-2.1-3.3-3.8.1z" fill="white"/>
    ),
  },
  coinbase: {
    bg: "#0052FF",
    content: (
      <path d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10 10-4.5 10-10S21.5 6 16 6zm0 15c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" fill="white"/>
    ),
  },
  trust: {
    bg: "#0500FF",
    content: (
      <path d="M16 6c-2 1.7-5.2 2.5-8 2.5v7c0 5.5 3.4 8.6 8 11 4.6-2.4 8-5.5 8-11v-7c-2.8 0-6-.8-8-2.5z" fill="none" stroke="white" strokeWidth="1.5"/>
    ),
  },
  phantom: {
    bg: "#AB9FF2",
    content: (
      <>
        <path d="M24.5 16c0 4.7-3.8 8.5-8.5 8.5S7.5 20.7 7.5 16 11.3 7.5 16 7.5s8.5 3.8 8.5 8.5z" fill="white" fillOpacity="0.15"/>
        <circle cx="13" cy="15" r="1.5" fill="white"/>
        <circle cx="19" cy="15" r="1.5" fill="white"/>
      </>
    ),
  },
  okx: {
    bg: "#000000",
    content: (
      <>
        <rect x="9" y="9" width="5" height="5" rx="0.5" fill="white"/>
        <rect x="18" y="9" width="5" height="5" rx="0.5" fill="white"/>
        <rect x="13.5" y="13.5" width="5" height="5" rx="0.5" fill="white"/>
        <rect x="9" y="18" width="5" height="5" rx="0.5" fill="white"/>
        <rect x="18" y="18" width="5" height="5" rx="0.5" fill="white"/>
      </>
    ),
  },
  rainbow: {
    bg: "#001E59",
    content: (
      <>
        <path d="M8 20v-2c0-4.4 3.6-8 8-8s8 3.6 8 8v2" fill="none" stroke="#FF4000" strokeWidth="2"/>
        <path d="M10.5 20v-2c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5v2" fill="none" stroke="#FF8C00" strokeWidth="2"/>
        <path d="M13 20v-2c0-1.7 1.3-3 3-3s3 1.3 3 3v2" fill="none" stroke="#FFDF00" strokeWidth="2"/>
      </>
    ),
  },
  ledger: {
    bg: "#000000",
    content: (
      <>
        <rect x="8" y="8" width="7" height="16" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
        <rect x="15" y="18" width="9" height="6" rx="1" fill="none" stroke="white" strokeWidth="1.5"/>
        <rect x="10" y="10" width="3" height="5" rx="0.5" fill="white" fillOpacity="0.4"/>
      </>
    ),
  },
  trezor: {
    bg: "#00854D",
    content: (
      <path d="M16 7c-2.8 0-5 2.2-5 5v2H9v10h14V14h-2v-2c0-2.8-2.2-5-5-5zm0 2c1.7 0 3 1.3 3 3v2h-6v-2c0-1.7 1.3-3 3-3z" fill="white"/>
    ),
  },
  keystone: {
    bg: "#2C2C2E",
    content: (
      <>
        <rect x="9" y="7" width="14" height="18" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
        <rect x="11" y="9" width="10" height="10" rx="1" fill="white" fillOpacity="0.2"/>
        <circle cx="16" cy="22" r="1.5" fill="white"/>
      </>
    ),
  },
  gridplus: {
    bg: "#4A4A4A",
    content: (
      <>
        <rect x="7" y="7" width="18" height="18" rx="3" fill="none" stroke="white" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="1.5" fill="white"/>
        <circle cx="20" cy="12" r="1.5" fill="white"/>
        <circle cx="12" cy="20" r="1.5" fill="white"/>
        <circle cx="20" cy="20" r="1.5" fill="white"/>
        <circle cx="16" cy="16" r="1.5" fill="white"/>
      </>
    ),
  },
};

export function WalletProviderIcon({ provider, size = 32, className = "" }: WalletProviderIconProps) {
  const icon = providerIcons[provider];
  if (!icon) {
    return (
      <div
        className={`rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        {provider.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-lg ${className}`}
    >
      <rect width="32" height="32" rx="6" fill={icon.bg} />
      {icon.content}
    </svg>
  );
}

export default WalletProviderIcon;
