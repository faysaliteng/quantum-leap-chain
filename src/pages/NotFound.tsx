import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" data-testid="page:not-found">
      <SEOHead title="Page Not Found" noindex />
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h1 className="text-xl font-semibold">{t("notFound.title")}</h1>
        <p className="text-sm text-muted-foreground font-mono">{location.pathname}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />{t("notFound.back")}</Link>
        </Button>
      </div>
    </div>
  );
}
