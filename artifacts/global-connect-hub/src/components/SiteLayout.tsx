import "@/i18n";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const SITE_URL = "https://noblespaces.rw";

type Meta = { title: string; desc: string; keywords?: string };

const titles: Record<string, Meta> = {
  "/": {
    title: "Interior Design, Furniture & Modern Kitchens in Kigali, Rwanda | Noble Spaces",
    desc: "Interior design, bespoke furniture, modern kitchens, wardrobes, ceilings, painting, soundproofing, carpets, curtains and renovation in Kigali, Rwanda. Trusted craftsmen for homes, offices and commercial spaces.",
    keywords: "interior design Kigali, interior design Rwanda, bespoke furniture Kigali, custom furniture Rwanda, modern kitchen installation Kigali, fitted wardrobes Rwanda, ceiling installation Kigali, painting works Kigali, soundproofing Rwanda, carpet supply Rwanda, curtains Kigali, sofa manufacturing Rwanda, office furniture Kigali, home renovation Rwanda, commercial interior design Kigali, residential interior design Rwanda, Gikondo interior design, Kicukiro interior design",
  },
  "/services": {
    title: "Interior Design & Furniture Services in Kigali, Rwanda | Noble Spaces",
    desc: "Explore 20+ interior services in Kigali, Rwanda — wardrobes, modern kitchens, bespoke sofas, ceilings, carpets, curtains, painting, soundproofing, TV walls, office furniture and full renovation. Book your free consultation today.",
    keywords: "interior services Kigali, furniture manufacturing Rwanda, kitchen installation Kigali, wardrobes Rwanda, sofa manufacturing Kigali, ceiling installation Rwanda, carpet supply Kigali, painting works Rwanda, soundproofing Kigali, curtains installation Rwanda, TV wall Kigali, office equipment Rwanda, dining tables Kigali, baby beds Rwanda, pet houses Kigali, console installation Rwanda, wall partitioning Kigali, fabric replacement Rwanda, sofa cleaning Kigali, carpet cleaning Rwanda, renovation Kigali",
  },
  "/about": {
    title: "About — Interior Design Studio in Kigali, Rwanda | Noble Spaces",
    desc: "Kigali-based interior design and furniture studio crafting noble interiors across Rwanda — homes, offices and commercial spaces, built with skilled local artisans.",
    keywords: "interior designers Rwanda, Kigali design studio, furniture makers Rwanda, interior design company Kigali, bespoke craftsmanship Rwanda",
  },
  "/gallery": {
    title: "Gallery — Interior Design & Furniture Projects in Kigali, Rwanda | Noble Spaces",
    desc: "Browse selected interior design, kitchen, wardrobe, ceiling and renovation projects in Kigali, Rwanda — bedrooms, kitchens, lounges, offices and more.",
    keywords: "interior design gallery Rwanda, kitchen projects Kigali, wardrobe projects Rwanda, renovation portfolio Kigali, furniture portfolio Rwanda",
  },
  "/contact": {
    title: "Contact — Interior Design & Furniture in Kigali, Rwanda | Noble Spaces",
    desc: "Get in touch with our interior design and furniture studio in Kigali, Kicukiro, Gikondo. Call +250 793 521 437 or email info@noblespaces.rw to book your interior design consultation, custom furniture, modern kitchen, ceiling, painting or renovation project.",
    keywords: "contact interior designer Kigali, interior design consultation Rwanda, Gikondo design studio, Kicukiro furniture studio, book interior designer Kigali",
  },
  "/book": {
    title: "Book a Service in Kigali | Noble Spaces",
    desc: "Choose a Noble Spaces design, furniture or home service and request an appointment in Kigali, Rwanda.",
    keywords: "book home service Kigali, interior design appointment Rwanda, Noble Spaces booking",
  },
};

const upsertMeta = (selector: string, attr: string, name: string, content: string) => {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string, hreflang?: string) => {
  const sel = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let tag = document.querySelector(sel);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    if (hreflang) tag.setAttribute("hreflang", hreflang);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

export const SiteLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  useEffect(() => {
    // Pages that own their metadata (useSeo) are skipped here.
    if (/^\/(shop|blog)(\/|$)/.test(pathname)) return;

    const meta =
      titles[pathname] ??
      (pathname.startsWith("/services/")
        ? {
            title: `Service Details — Noble Spaces, Kigali Rwanda`,
            desc: `Discover this interior design service by Noble Spaces in Kigali, Rwanda. Expert craftsmanship and bespoke installation.`,
            keywords: "Noble Spaces service, Kigali interior service, Rwanda furniture",
          }
        : titles["/"]);


    document.title = meta.title;
    upsertMeta('meta[name="description"]', "name", "description", meta.desc);
    if (meta.keywords) {
      upsertMeta('meta[name="keywords"]', "name", "keywords", meta.keywords);
    }

    const url = `${SITE_URL}${pathname}`;
    upsertLink("canonical", url);
    upsertLink("alternate", url, "en");
    upsertLink("alternate", url, "fr");
    upsertLink("alternate", url, "rw");
    upsertLink("alternate", url, "x-default");

    upsertMeta('meta[property="og:title"]', "property", "og:title", meta.title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", meta.desc);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", meta.title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", meta.desc);

    const sensitive = pathname.startsWith("/admin") || pathname === "/404";
    upsertMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      sensitive ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
  }, [pathname]);


  return (
    <div className="noise relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
