import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Facebook, ArrowRight } from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { SOCIAL_LINKS } from "@/data/socials";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export const Contact = ({ preview = false }: { preview?: boolean }) => {
  const { t } = useTranslation();

  const cards = [
    {
      icon: Phone,
      label: t("contact.phone"),
      values: ["+250 793 521 437"],
      href: "tel:+250793521437",
    },
    {
      icon: Mail,
      label: t("contact.email"),
      values: ["info@noblespaces.rw"],
      href: "mailto:info@noblespaces.rw",
    },
    {
      icon: MapPin,
      label: t("contact.location"),
      values: [t("contact.address")],
      href: "#map",
    },
  ];

  return (
    <section id="contact" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.3em] text-gold">— 04</span>
            <h2 className="mt-4 font-display text-5xl font-semibold leading-tight lg:text-6xl">
              {t("contact.title")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("contact.subtitle")}</p>
          </div>
          {preview && (
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold transition-all hover:bg-gold/10"
            >
              {t("common.view_all")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArrowRight className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("tooltip.view_all")}</p>
                </TooltipContent>
              </Tooltip>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="group rounded-3xl border border-gold/20 bg-card p-8 transition-all hover:border-gold/60 hover:bg-secondary"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors group-hover:bg-gold group-hover:text-primary-foreground">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-xs uppercase tracking-[0.25em] text-gold/80">{c.label}</div>
              <div className="mt-2 space-y-1 font-display text-xl text-foreground">
                {c.values.map((v) => <div key={v}>{v}</div>)}
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-4">
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("footer.follow")}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold hover:text-primary-foreground"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.instagram")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold hover:text-primary-foreground"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.facebook")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold hover:text-primary-foreground"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.tiktok")}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div id="map" className="mt-16">
          <div className="mb-6 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-gold" />
            <span className="text-xs uppercase tracking-[0.25em] text-gold">{t("contact.find_us")}</span>
          </div>
          <div className="overflow-hidden rounded-3xl border border-gold/20 shadow-deep">
            <iframe
              title="Noble Spaces location — Kigali, Kicukiro, Gikondo"
              src="https://www.google.com/maps?q=-1.9681974586988202,30.0738030981466&hl=en&z=17&output=embed"
              width="100%"
              height="450"
              style={{ border: 0, filter: "saturate(0.85) brightness(0.9)" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href="https://www.google.com/maps?q=-1.9681974586988202,30.0738030981466"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" /> Open in Google Maps
          </a>
        </div>
      </div>
    </section>
  );
};
