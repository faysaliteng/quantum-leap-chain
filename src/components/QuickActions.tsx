import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  to: string;
  variant?: "default" | "outline" | "ghost";
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button key={a.label} variant={a.variant ?? "outline"} size="sm" asChild>
          <Link to={a.to}>
            <a.icon className="mr-1.5 h-3.5 w-3.5" />
            {a.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
