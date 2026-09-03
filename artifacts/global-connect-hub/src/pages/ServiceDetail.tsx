import "@/i18n";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Phone, Mail, CheckCircle2, Hammer, CalendarClock, Clock, CalendarCheck, Wallet } from "lucide-react";
import { useService } from "@/hooks/useServices";
import { getServiceIndex } from "@/data/services";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Lightbox } from "@/components/Lightbox";
import { ServicePhotoAdminPanel } from "@/components/admin/ServicePhotoAdminPanel";
import { supabase } from "@/integrations/supabase/client";

type ServiceItem = { title: string; desc: string };

const ServiceDetail = () => {
  const { slug = "" } = useParams();
  const { t } = useTranslation();
  const { service: svc, index: idx, all } = useService(slug);
  const items = t("services.items", { returnObjects: true }) as ServiceItem[];
  const fbIdx = getServiceIndex(slug);
  const fallback = fbIdx >= 0 ? items[fbIdx] : undefined;
  const title = svc?.title ?? fallback?.title;
  const description = svc?.description ?? fallback?.desc;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [adminPhotos, setAdminPhotos] = useState<string[]>([]);
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0);
  const { isAdmin } = useIsAdmin();

  const loadPhotos = useCallback(async () => {
    if (!slug) return;
    const { data } = await supabase
      .from("service_photos")
      .select("storage_path")
      .eq("service_slug", slug)
      .order("created_at", { ascending: false });
    const paths = (data ?? []).map((r: { storage_path: string }) => r.storage_path);
    if (!paths.length) { setAdminPhotos([]); return; }
    const { data: signed } = await supabase.storage
      .from("service-photos")
      .createSignedUrls(paths, 60 * 60 * 24 * 7);
    setAdminPhotos((signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[]);
  }, [slug]);

  useEffect(() => { loadPhotos(); }, [loadPhotos, photoRefreshKey]);

  const effectiveCover = svc?.cover || adminPhotos[0] || "";
  const effectiveGallery = useMemo(() => {
    if (!svc) return [] as string[];
    const bundled = svc.gallery ?? [];
    const extras = svc.cover ? adminPhotos : adminPhotos.slice(1);
    const seen = new Set<string>();
    return [...bundled, ...extras].filter((s) => {
      if (!s || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  }, [svc, adminPhotos]);

  const lightboxItems = useMemo(() => {
    if (!svc) return [];
    const list: { src: string; alt: string }[] = [];
    const seen = new Set<string>();
    if (effectiveCover) {
      list.push({ src: effectiveCover, alt: title ?? "" });
      seen.add(effectiveCover);
    }
    effectiveGallery.forEach((src, i) => {
      if (seen.has(src)) return;
      seen.add(src);
      list.push({ src, alt: `${title ?? ""} ${i + 1}` });
    });
    return list;
  }, [svc, title, effectiveCover, effectiveGallery]);

  const openLightbox = (src: string) => {
    const i = lightboxItems.findIndex((it) => it.src === src);
    setLightboxIndex(i >= 0 ? i : 0);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (title && description) {
      document.title = `${title} — Noble Spaces`;
      const meta =
        document.querySelector('meta[name="description"]') ??
        (() => {
          const m = document.createElement("meta");
          m.setAttribute("name", "description");
          document.head.appendChild(m);
          return m;
        })();
      meta.setAttribute("content", description);
    }
  }, [title, description]);

  if (!svc || !title) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-4xl">Service not found</h1>
        <Link to="/services" className="mt-6 inline-flex items-center gap-2 text-gold">
          <ArrowLeft className="h-4 w-4" /> Back to services
        </Link>
      </section>
    );
  }

  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const prevTitle = prev.title ?? items[(idx - 1 + all.length) % all.length]?.title ?? prev.slug;
  const nextTitle = next.title ?? items[(idx + 1) % all.length]?.title ?? next.slug;
  const Icon = svc.icon;

  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-16 lg:pt-44">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold/80 hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t("nav.services")}
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-end">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 text-gold">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-display text-xs uppercase tracking-[0.3em] text-gold/70">
                  — {String(idx + 1).padStart(2, "0")} / {String(all.length).padStart(2, "0")}
                </span>
              </div>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-tight lg:text-6xl">
                {title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {description}
              </p>

              {/* Availability card */}
              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gold/20 bg-card/60 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold/80">
                    {svc.availability === "both" ? <CheckCircle2 className="h-4 w-4" />
                      : svc.availability === "custom" ? <Hammer className="h-4 w-4" />
                      : <CalendarClock className="h-4 w-4" />}
                    {t("booking.availability")}
                  </div>
                  <div className="mt-2 font-display text-base text-foreground">
                    {svc.availability === "both" && t("booking.ready_stock")}
                    {svc.availability === "custom" && t("booking.custom_only")}
                    {svc.availability === "service" && t("booking.on_site")}
                  </div>
                </div>
                <div className="rounded-2xl border border-gold/20 bg-card/60 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold/80">
                    <Clock className="h-4 w-4" /> {t("booking.lead_time")}
                  </div>
                  <div className="mt-2 font-display text-base text-foreground">
                    {svc.leadTimeDays[0]}–{svc.leadTimeDays[1]} {t("booking.days")}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={`/book?service=${svc.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground transition-all hover:bg-gold/90"
                >
                  <CalendarCheck className="h-4 w-4" /> Book Now
                </Link>
                <Link
                  to={`/book?service=${svc.slug}&mode=pay`}
                  className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-6 py-3 text-sm uppercase tracking-[0.2em] text-gold ring-1 ring-inset ring-gold/50 transition-all hover:bg-gold/20"
                >
                  <Wallet className="h-4 w-4" /> Pay Now
                </Link>
                <a
                  href="tel:+250793521437"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-3 text-sm uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold/10"
                >
                  <Phone className="h-4 w-4" /> {t("hero.cta_primary")}
                </a>
                <a
                  href="mailto:info@noblespaces.rw"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-3 text-sm uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold/10"
                >
                  <Mail className="h-4 w-4" /> Email
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => effectiveCover && openLightbox(effectiveCover)}
              aria-label={`Open ${title}`}
              className="group block overflow-hidden rounded-3xl border border-gold/20 shadow-deep focus:outline-none focus:ring-2 focus:ring-gold/60"
            >
              {effectiveCover ? (
                <img
                  src={effectiveCover}
                  alt={title}
                  width={1280}
                  height={896}
                  className="h-full w-full cursor-zoom-in object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-secondary/40 text-sm text-muted-foreground">
                  No featured image yet
                </div>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-gold">— Gallery</span>
              <h2 className="mt-3 font-display text-3xl lg:text-4xl">{t("gallery.title")}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {effectiveGallery.map((src, i) => (
              <button
                type="button"
                key={`${src}-${i}`}
                onClick={() => openLightbox(src)}
                aria-label={`Open ${title} image ${i + 1}`}
                className={`group relative block w-full overflow-hidden rounded-2xl border border-gold/15 text-left focus:outline-none focus:ring-2 focus:ring-gold/60 ${
                  i === 0 ? "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto" : "aspect-square"
                }`}
              >
                <img
                  src={src}
                  alt={`${title} ${i + 1}`}
                  loading="lazy"
                  width={1280}
                  height={896}
                  className="h-full w-full cursor-zoom-in object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>

          {isAdmin && (
            <div className="mt-10">
              <ServicePhotoAdminPanel
                slug={svc.slug}
                onChanged={() => setPhotoRefreshKey((k) => k + 1)}
              />
            </div>
          )}
        </div>
      </section>

      {/* Prev / Next */}
      <section className="border-t border-gold/10 py-16">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-2xl border border-gold/15 bg-gold/15 px-6 sm:grid-cols-2 lg:px-10">
          <Link
            to={`/services/${prev.slug}`}
            className="group flex items-center justify-between gap-6 bg-card p-8 transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-4">
              <ArrowLeft className="h-5 w-5 text-gold transition-transform group-hover:-translate-x-1" />
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-gold/70">Previous</div>
                <div className="mt-1 font-display text-lg">{prevTitle}</div>
              </div>
            </div>
          </Link>
          <Link
            to={`/services/${next.slug}`}
            className="group flex items-center justify-between gap-6 bg-card p-8 transition-colors hover:bg-secondary sm:text-right"
          >
            <div className="flex flex-1 items-center justify-end gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-gold/70">Next</div>
                <div className="mt-1 font-display text-lg">{nextTitle}</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gold transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      <Lightbox
        items={lightboxItems}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
};

export default ServiceDetail;
