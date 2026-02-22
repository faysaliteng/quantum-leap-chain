import { Link, useLocation } from "react-router-dom";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const docsLinks = [
  { path: "/docs/architecture", label: "Architecture" },
  { path: "/docs/security", label: "Security" },
  { path: "/docs/schema", label: "Schema" },
  { path: "/docs/api", label: "API" },
  { path: "/docs/singularitycoin", label: "SingularityCoin" },
];

export function DocsNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <CryptoniumpayLogo size="sm" />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(!open)}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-sm">
          <nav className="max-w-5xl mx-auto flex flex-col gap-1 py-3 px-4">
            {docsLinks.map((link) => (
              <Button
                key={link.path}
                variant="ghost"
                size="sm"
                asChild
                className={cn("justify-start text-xs", pathname === link.path && "bg-accent text-accent-foreground")}
                onClick={() => setOpen(false)}
              >
                <Link to={link.path}>{link.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
