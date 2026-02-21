import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground font-mono">{location.pathname}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
