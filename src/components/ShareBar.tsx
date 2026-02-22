import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";

interface ShareBarProps {
  title: string;
  className?: string;
}

export function ShareBar({ title, className = "" }: ShareBarProps) {
  const url = window.location.href;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="text-xs h-7">
          Share on X
        </Button>
      </a>
      <CopyButton value={url} />
    </div>
  );
}
