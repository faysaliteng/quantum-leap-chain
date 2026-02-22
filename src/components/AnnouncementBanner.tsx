import { useState, useEffect } from "react";
import { X, Megaphone, AlertTriangle, Sparkles } from "lucide-react";

interface AnnouncementBannerProps {
  message: string;
  type?: "info" | "warning" | "promo";
  dismissible?: boolean;
  id?: string;
}

export function AnnouncementBanner({ message, type = "info", dismissible = true, id }: AnnouncementBannerProps) {
  const storageKey = `announcement_dismissed_${id ?? message.slice(0, 20)}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setVisible(true);
  }, [storageKey]);

  if (!visible) return null;

  const styles = {
    info: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))] border-[hsl(var(--info))]/20",
    warning: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20",
    promo: "bg-primary/10 text-primary border-primary/20",
  };

  const icons = { info: Megaphone, warning: AlertTriangle, promo: Sparkles };
  const Icon = icons[type];

  return (
    <div className={`border-b px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${styles[type]}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
      {dismissible && (
        <button
          onClick={() => { setVisible(false); localStorage.setItem(storageKey, "1"); }}
          className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss announcement"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
