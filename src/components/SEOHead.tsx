import { useEffect } from "react";
import { SEO } from "@/lib/constants";

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
}

export function SEOHead({
  title,
  description = SEO.defaultDescription,
  ogImage = SEO.ogImage,
  ogType = "website",
  canonical,
  noindex = false,
}: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title ? SEO.titleTemplate.replace("%s", title) : SEO.defaultTitle;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", description);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:image", ogImage, true);
    setMeta("og:type", ogType, true);
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);

    if (noindex) {
      setMeta("robots", "noindex, nofollow");
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    return () => {
      document.title = SEO.defaultTitle;
    };
  }, [title, description, ogImage, ogType, canonical, noindex]);

  return null;
}
