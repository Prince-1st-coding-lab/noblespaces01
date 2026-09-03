import { useEffect } from "react";

export const SITE_URL = "https://noblespaces.rw";

const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const removeMeta = (selector: string) => {
  document.head.querySelector(selector)?.remove();
};

const absolute = (url?: string | null) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

/** Per-page SEO: title, description, canonical, OpenGraph/Twitter image and JSON-LD. */
export const useSeo = ({
  title,
  description,
  path,
  image,
  type = "website",
  jsonLd,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | null;
}) => {
  const ld = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

    const img = absolute(image);
    if (img) {
      setMeta('meta[property="og:image"]', "property", "og:image", img);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", img);
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[name="twitter:image"]');
    }

    if (path) {
      const href = `${SITE_URL}${path}`;
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = href;
      setMeta('meta[property="og:url"]', "property", "og:url", href);
    }

    const ID = "page-json-ld";
    document.getElementById(ID)?.remove();
    if (ld) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = ID;
      script.textContent = ld;
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(ID)?.remove();
    };
  }, [title, description, path, image, type, ld]);
};
