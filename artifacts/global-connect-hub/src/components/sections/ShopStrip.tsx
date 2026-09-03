import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRwf, useProducts } from "@/hooks/useProducts";

/** Compact "from our shop" strip — keeps services as the hero of the homepage. */
export const ShopStrip = () => {
  const { data: products = [], isLoading, isError } = useProducts();
  const picks = [...products]
    .sort((a, b) => Number(b.trending) - Number(a.trending) || Number(b.featured) - Number(a.featured))
    .slice(0, 4);

  if (isError) return null;
  if (!isLoading && picks.length === 0) return null;

  return (
    <section aria-labelledby="shop-strip-heading" className="border-y border-gold/15 bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-gold">— Also from Noble Spaces</span>
            <h2 id="shop-strip-heading" className="mt-3 font-display text-3xl font-semibold lg:text-4xl">
              Ready-made pieces in our shop
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-2.5 text-xs uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold/10"
          >
            Browse the shop <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)
            : picks.map((p) => (
                <Link
                  key={p.id}
                  to={`/shop/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gold/15 bg-card transition-colors hover:border-gold/50"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm">{p.name}</p>
                    <p className="mt-1 text-sm text-gold">{formatRwf(p.price)}</p>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
};
