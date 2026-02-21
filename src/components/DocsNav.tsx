import { Link, useLocation } from "react-router-dom";
import { CryptonpayLogo } from "@/components/CryptonpayLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const docsLinks = [
  { path: "/docs/architecture", label: "Architecture" },
  { path: "/docs/security", label: "Security" },
  { path: "/docs/schema", label: "Schema" },
  { path: "/docs/api", label: "API" },
  { path: "/docs/singularitycoin", label: "SingularityCoin" },
];

export function DocsNav() {
  const { pathname } = useLocation();

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <CryptonpayLogo size="sm" />
        </div>
        <nav className="flex items-center gap-1">
          {docsLinks.map((link) => (
            <Button
              key={link.path}
              variant="ghost"
              size="sm"
              asChild
              className={cn("text-xs", pathname === link.path && "bg-accent text-accent-foreground")}
            >
              <Link to={link.path}>{link.label}</Link>
            </Button>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
