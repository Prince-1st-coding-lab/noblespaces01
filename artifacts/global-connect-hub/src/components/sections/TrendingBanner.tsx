import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRwf, useProducts, type Product } from "@/hooks/useProducts";

const AUTOPLAY_MS = 4500;

const Banner = ({ product }: { product: Product }) => {
  const image = product.images[0];
  return (
    <article className="relative min-h-[380px] w-full overflow-hidden rounded-3xl border border-gold/20 bg-card sm:min-h-[440px] lg:min-h-[520px]">
      {image ? (
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 gradient-emerald" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />

      <div className="relative flex min-h-[380px] max-w-2xl flex-col justify-center gap-5 p-8 sm:min-h-[440px] sm:p-12 lg:min-h-[520px] lg:p-16">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.3em] text-gold">
          <Flame className="h-3.5 w-3.5" aria-hidden="true" /> Trending
        </span>
        <h3 className="font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          {product.name}
        </h3>
        {product.short_description && (
          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">{product.short_description}</p>
        )}
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl text-gold sm:text-4xl">{formatRwf(product.price)}</span>
          {product.compare_at_price ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatRwf(product.compare_at_price)}
            </span>
          ) : null}
        </div>
        <Button asChild size="lg" className="w-fit">
          <Link to={`/shop/${product.slug}`} aria-label={`Shop ${product.name}`}>
            Shop now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
};

export const TrendingBanner = () => {
  const { data: products = [], isLoading, isError } = useProducts();
  const trending = products.filter((p) => p.trending);
  const multiple = trending.length > 1;

  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start", duration: 30 }, []);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  const onSelect = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    embla.on("pointerDown", () => setPaused(true));
    embla.on("pointerUp", () => setPaused(false));
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  useEffect(() => {
    if (!embla || !multiple || paused) return;
    const id = window.setInterval(() => embla.scrollNext(), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [embla, multiple, paused]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </section>
    );
  }

  if (isError || trending.length === 0) return null;

  return (
    <section aria-labelledby="trending-heading" className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold">— Trending now</span>
          <h2 id="trending-heading" className="mt-3 font-display text-4xl font-semibold lg:text-5xl">
            Pieces people love
          </h2>
        </div>
        <Link to="/shop" className="hidden shrink-0 text-xs uppercase tracking-[0.25em] text-gold hover:underline sm:block">
          View all
        </Link>
      </div>

      {!multiple ? (
        <Banner product={trending[0]} />
      ) : (
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {trending.map((p) => (
                <div key={p.id} className="min-w-0 flex-[0_0_100%] pr-0">
                  <Banner product={p} />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Previous trending product"
            onClick={() => embla?.scrollPrev()}
            className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-background/80 text-gold backdrop-blur transition-colors hover:bg-gold hover:text-primary-foreground sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next trending product"
            onClick={() => embla?.scrollNext()}
            className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-background/80 text-gold backdrop-blur transition-colors hover:bg-gold hover:text-primary-foreground sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-6 flex justify-center gap-2">
            {trending.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === selected}
                onClick={() => embla?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === selected ? "w-8 bg-gold" : "w-3 bg-border hover:bg-gold/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
