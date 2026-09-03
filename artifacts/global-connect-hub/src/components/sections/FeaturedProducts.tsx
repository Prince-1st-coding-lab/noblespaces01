import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/shop/ProductCard";

export const FeaturedProducts = () => {
  const { data: products = [], isLoading, isError } = useProducts();
  const featured = (products.filter((p) => p.featured).length > 0
    ? products.filter((p) => p.featured)
    : products
  ).slice(0, 6);

  if (isError) return null;
  if (!isLoading && featured.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold">— Shop</span>
          <h2 id="featured-heading" className="mt-3 font-display text-4xl font-semibold lg:text-5xl">
            Featured products
          </h2>
        </div>
        <Link to="/shop" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold hover:underline">
          All products <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-3xl" />)
          : featured.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
};
