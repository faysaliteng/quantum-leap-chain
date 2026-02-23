/**
 * Real cryptocurrency SVG icons for all supported chains.
 * Each icon is an inline SVG with the official brand colors.
 */

interface CryptoIconProps {
  chain: string;
  size?: number;
  className?: string;
}

const icons: Record<string, { color: string; path: JSX.Element }> = {
  btc: {
    color: "#F7931A",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          d="M23.2 14.1c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.2l-2.2-.6-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .1 0l-.1 0-1.1 4.5c-.1.2-.3.5-.7.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.9.5 5 .3 5.9-2.3.7-2.1 0-3.3-1.5-4.1 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2.1-4.1 1-5.3.7l.9-3.8c1.2.3 4.9.9 4.4 3.1zm.5-5.4c-.5 1.9-3.5.9-4.5.7l.8-3.4c1 .3 4.2.7 3.7 2.7z"
          fill="white"
        />
      </g>
    ),
  },
  eth: {
    color: "#627EEA",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <path d="M16.5 4v8.9l7.5 3.3L16.5 4z" fill="white" fillOpacity="0.6" />
        <path d="M16.5 4L9 16.2l7.5-3.3V4z" fill="white" />
        <path d="M16.5 22v6l7.5-10.4-7.5 4.4z" fill="white" fillOpacity="0.6" />
        <path d="M16.5 28v-6L9 17.6 16.5 28z" fill="white" />
        <path d="M16.5 20.6l7.5-4.4-7.5-3.3v7.7z" fill="white" fillOpacity="0.2" />
        <path d="M9 16.2l7.5 4.4v-7.7L9 16.2z" fill="white" fillOpacity="0.6" />
      </g>
    ),
  },
  bsc: {
    color: "#F3BA2F",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
        <path
          d="M12.1 14.5L16 10.6l3.9 3.9 2.3-2.3L16 6l-6.2 6.2 2.3 2.3zm-6.1 1.5l2.3-2.3 2.3 2.3-2.3 2.3L6 16zm6.1 1.5L16 21.4l3.9-3.9 2.3 2.3L16 26l-6.2-6.2 2.3-2.3v.5zm9.6-1.5l2.3-2.3 2.3 2.3-2.3 2.3-2.3-2.3zM18.8 16L16 13.2 13.8 15.4l-.3.3-.3.3L16 18.8l2.8-2.8z"
          fill="white"
        />
      </g>
    ),
  },
  polygon: {
    color: "#8247E5",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#8247E5" />
        <path
          d="M21.2 12.6c-.4-.2-.9-.2-1.2 0l-2.8 1.6-1.9 1.1-2.8 1.6c-.4.2-.9.2-1.2 0l-2.2-1.3c-.4-.2-.6-.6-.6-1.1v-2.5c0-.4.2-.9.6-1.1l2.2-1.3c.4-.2.9-.2 1.2 0l2.2 1.3c.4.2.6.6.6 1.1v1.6l1.9-1.1v-1.6c0-.4-.2-.9-.6-1.1l-4-2.3c-.4-.2-.9-.2-1.2 0l-4.1 2.4c-.4.2-.6.6-.6 1v4.6c0 .4.2.9.6 1.1l4.1 2.3c.4.2.9.2 1.2 0l2.8-1.6 1.9-1.1 2.8-1.6c.4-.2.9-.2 1.2 0l2.2 1.3c.4.2.6.6.6 1.1v2.5c0 .4-.2.9-.6 1.1l-2.1 1.3c-.4.2-.9.2-1.2 0l-2.2-1.3c-.4-.2-.6-.6-.6-1.1v-1.6l-1.9 1.1v1.6c0 .4.2.9.6 1.1l4.1 2.3c.4.2.9.2 1.2 0l4.1-2.3c.4-.2.6-.6.6-1.1v-4.6c0-.4-.2-.9-.6-1.1l-4.2-2.4z"
          fill="white"
        />
      </g>
    ),
  },
  arbitrum: {
    color: "#28A0F0",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#28A0F0" />
        <path d="M16 7l-7 12.5L16 25l7-5.5L16 7z" fill="white" fillOpacity="0.8" />
        <path d="M16 7v18l7-5.5L16 7z" fill="white" fillOpacity="0.5" />
      </g>
    ),
  },
  optimism: {
    color: "#FF0420",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#FF0420" />
        <path
          d="M10.8 20.4c-1.4 0-2.5-.4-3.3-1.2-.8-.8-1.2-1.9-1.2-3.4s.5-2.8 1.4-3.8c1-1.1 2.2-1.6 3.8-1.6 1.4 0 2.4.4 3.2 1.2.8.8 1.1 1.9 1.1 3.3 0 1.6-.5 2.9-1.4 3.9-.9 1.1-2.2 1.6-3.6 1.6zm.2-2c.6 0 1.2-.3 1.6-.8.4-.6.7-1.3.7-2.3 0-.7-.2-1.2-.5-1.6-.3-.4-.8-.6-1.4-.6-.6 0-1.2.3-1.6.8-.4.6-.7 1.3-.7 2.3 0 .7.2 1.2.5 1.6.4.4.8.6 1.4.6zM17.5 20.2l1.8-8.6h3.5c1.1 0 1.9.3 2.5.8.6.5.8 1.2.8 2.1 0 1.1-.4 2-1.1 2.7-.7.7-1.7 1-2.9 1h-1.8l-.5 2h-2.3zm3.5-3.9h1.2c.5 0 .9-.1 1.2-.4.3-.3.5-.7.5-1.1 0-.3-.1-.6-.3-.8-.2-.2-.6-.3-1-.3h-1.2l-.4 2.6z"
          fill="white"
        />
      </g>
    ),
  },
  solana: {
    color: "#9945FF",
    path: (
      <g>
        <defs>
          <linearGradient id="sol-grad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#00FFA3" />
            <stop offset="100%" stopColor="#9945FF" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="16" fill="url(#sol-grad)" />
        <path
          d="M9.5 19.8c.1-.1.3-.2.5-.2h12.4c.3 0 .5.4.3.6l-2.1 2.1c-.1.1-.3.2-.5.2H7.7c-.3 0-.5-.4-.3-.6l2.1-2.1zM9.5 9.5c.1-.1.3-.2.5-.2h12.4c.3 0 .5.4.3.6l-2.1 2.1c-.1.1-.3.2-.5.2H7.7c-.3 0-.5-.4-.3-.6l2.1-2.1zM22.5 14.6c-.1-.1-.3-.2-.5-.2H9.6c-.3 0-.5.4-.3.6l2.1 2.1c.1.1.3.2.5.2h12.4c.3 0 .5-.4.3-.6l-2.1-2.1z"
          fill="white"
        />
      </g>
    ),
  },
  tron: {
    color: "#FF0013",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#FF0013" />
        <path
          d="M22.8 9.5L8.2 13.4l6.7 5.1 7.9-9zM15.9 19.6l-1.5 6.2 8.8-14.4-7.3 8.2zM13.6 18l-5-3.8 4.2 10.3 .8-6.5z"
          fill="white"
        />
      </g>
    ),
  },
  ltc: {
    color: "#345D9D",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#345D9D" />
        <path
          d="M16 6a10 10 0 100 20 10 10 0 000-20zm-.3 4.3h2.7L17 16.5l2-.8-.4 1.5-2 .8L15.5 22H10l1.3-5.2-1.6.6.4-1.5 1.6-.6 1-4z"
          fill="white"
        />
      </g>
    ),
  },
  doge: {
    color: "#C2A633",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#C2A633" />
        <path
          d="M13.2 10h3.3c1.6 0 2.8.4 3.7 1.3.9.8 1.3 2 1.3 3.5v2.4c0 1.5-.4 2.7-1.3 3.5-.9.8-2.1 1.3-3.7 1.3h-3.3V10zm2.2 2v8h1.2c.9 0 1.5-.3 2-.8.4-.5.7-1.3.7-2.3v-1.8c0-1-.2-1.8-.7-2.3-.4-.5-1.1-.8-2-.8h-1.2zM10 15.5h6v2h-6v-2z"
          fill="white"
        />
      </g>
    ),
  },
  avax: {
    color: "#E84142",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#E84142" />
        <path
          d="M20.5 20.5h-3c-.3 0-.5-.1-.7-.4l-2.7-5.2c-.1-.2-.1-.5 0-.7l1.5-2.9c.2-.3.5-.5.8-.5s.6.2.8.5l4 7.8c.1.2.1.5 0 .7-.2.3-.4.5-.7.5v.2zM11.8 20.5H9.5c-.3 0-.6-.2-.7-.5-.1-.2-.1-.5 0-.7l1.5-2.9c.2-.3.5-.5.8-.5.3 0 .6.2.8.5l1.5 2.9c.1.2.1.5 0 .7-.2.3-.4.5-.7.5h-.9z"
          fill="white"
        />
      </g>
    ),
  },
  fantom: {
    color: "#1969FF",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#1969FF" />
        <path
          d="M17.2 7.4l3.7 2.1c.3.2.5.5.5.9v4.3c0 .1 0 .2-.1.3L17 12.4V7.6c0-.1.1-.2.2-.2zm-2.4 0L11.1 9.5c-.3.2-.5.5-.5.9v4.3c0 .1 0 .2.1.3L15 12.4V7.6c0-.1-.1-.2-.2-.2zM21 17.5v-2.8l-4.4 2.5v5l3.9-2.2c.3-.2.5-.5.5-.9v-1.6zm-10 0v-2.8l4.4 2.5v5l-3.9-2.2c-.3-.2-.5-.5-.5-.9v-1.6zM16 13.5l4.3-2.5-4-2.3c-.2-.1-.4-.1-.6 0L11.7 11l4.3 2.5z"
          fill="white"
        />
      </g>
    ),
  },
  base: {
    color: "#0052FF",
    path: (
      <g>
        <circle cx="16" cy="16" r="16" fill="#0052FF" />
        <path
          d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10c5.2 0 9.5-4 10-9h-5.5c-.5 2.7-2.8 4.7-5.5 4.7-3.1 0-5.7-2.5-5.7-5.7S11.9 10.3 15 10.3c2.7 0 5 2 5.5 4.7H26c-.5-5-4.8-9-10-9z"
          fill="white"
        />
      </g>
    ),
  },
};

export function CryptoIcon({ chain, size = 24, className = "" }: CryptoIconProps) {
  const icon = icons[chain];
  if (!icon) {
    return (
      <div
        className={`rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        {chain.slice(0, 2).toUpperCase()}
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
      className={className}
    >
      {icon.path}
    </svg>
  );
}

export default CryptoIcon;
