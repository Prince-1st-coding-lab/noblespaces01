import { forwardRef, useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useServicePhotos } from "@/hooks/useServicePhotos";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbox } from "@/components/Lightbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const PAGE_SIZE = 24;

type GalleryImageProps = {
  src: string;
  alt: string;
  featured?: boolean;
  onOpen: () => void;
};

const GalleryImage = forwardRef<HTMLButtonElement, GalleryImageProps>(
  ({ src, alt, featured, onOpen }, ref) => {
  const [loaded, setLoaded] = useState(false);

  // Reset loaded state when src changes (e.g. on page change with reused DOM nodes)
  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      aria-label={`Open ${alt}`}
      className={`group relative block w-full overflow-hidden rounded-3xl border border-gold/20 text-left focus:outline-none focus:ring-2 focus:ring-gold/60 ${
        featured ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square"
      }`}
    >
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full rounded-3xl" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={1280}
        height={896}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute bottom-4 left-4 translate-y-2 font-display text-lg capitalize text-gold opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
        {alt}
      </div>
    </button>
  );
});
GalleryImage.displayName = "GalleryImage";

export const Gallery = ({ preview = false }: { preview?: boolean }) => {
  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();
  const { data: photos, isLoading: photosLoading } = useServicePhotos();
  const [page, setPage] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Build the gallery from real per-service photos: uploaded photos (database)
  // plus any bundled images. Only services that exist in the database are shown.
  // Homepage preview = one cover per service; /gallery = every image.
  const all = useMemo(() => {
    const bySlug = new Map<string, string[]>();
    services.forEach((s) => {
      const uploaded = photos.filter((p) => p.slug === s.slug).map((p) => p.url);
      const list = [...(s.cover ? [s.cover] : []), ...(s.gallery ?? []), ...uploaded];
      bySlug.set(s.slug, list);
    });

    const source = preview
      ? services
          .map((s) => ({ src: bySlug.get(s.slug)?.[0] ?? "", label: s.title || s.slug.replace(/-/g, " ") }))
          .filter((it) => it.src)
      : services.flatMap((s) =>
          (bySlug.get(s.slug) ?? []).map((src) => ({
            src,
            label: s.title || s.slug.replace(/-/g, " "),
          })),
        );

    const seen = new Set<string>();
    return source.filter((it) => {
      if (seen.has(it.src)) return false;
      seen.add(it.src);
      return true;
    });
  }, [services, photos, preview]);

  const totalPages = preview ? 1 : Math.max(1, Math.ceil(all.length / PAGE_SIZE));

  // Clamp page if data shrinks
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const items = preview
    ? all.slice(0, 8)
    : all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Scroll to top of gallery on page change
  const goToPage = (p: number) => {
    setPage(p);
    if (typeof window !== "undefined") {
      const el = document.getElementById("gallery");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const showSkeletons = (isLoading || photosLoading) && all.length === 0;

  return (
    <section id="gallery" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-gold">— 03</span>
            <h2 className="mt-4 font-display text-5xl font-semibold leading-tight lg:text-6xl">
              {t("gallery.title")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("gallery.subtitle")}</p>
          </div>
          {preview && (
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold transition-all hover:bg-gold/10"
            >
              {t("common.view_all")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArrowRight className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("tooltip.view_gallery")}</p>
                </TooltipContent>
              </Tooltip>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {showSkeletons
            ? Array.from({ length: preview ? 8 : PAGE_SIZE }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={`rounded-3xl ${
                    preview && i === 0
                      ? "col-span-2 row-span-2 aspect-square md:aspect-auto"
                      : "aspect-square"
                  }`}
                />
              ))
            : items.map((it, i) => {
                const absoluteIndex = preview ? i : (page - 1) * PAGE_SIZE + i;
                return (
                  <GalleryImage
                    key={`${it.src}-${i}`}
                    src={it.src}
                    alt={it.label}
                    featured={preview && i === 0}
                    onOpen={() => {
                      setLightboxIndex(absoluteIndex);
                      setLightboxOpen(true);
                    }}
                  />
                );
              })}
        </div>

        {!preview && totalPages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("tooltip.previous")}</p>
              </TooltipContent>
            </Tooltip>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const isActive = p === page;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-xs uppercase tracking-[0.2em] transition-all ${
                    isActive
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-gold/30 text-muted-foreground hover:border-gold/60 hover:text-gold"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("tooltip.next")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      <Lightbox
        items={all.map((it) => ({ src: it.src, alt: it.label }))}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
};
