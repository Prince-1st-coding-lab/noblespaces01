import { Link, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";
import { useProductCategories, useProducts } from "@/hooks/useProducts";
import { ProductBrowser, type BrowseState } from "@/components/shop/ProductBrowser";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const { data: categories = [], isLoading: loadingCats } = useProductCategories();
  const category = categories.find((c) => c.slug === slug) ?? null;
  const { data: products = [], isLoading, isError } = useProducts({ categoryId: category?.id ?? null });

  const state: BrowseState = {
    q: params.get("q") ?? "",
    sort: params.get("sort") ?? "newest",
    max: params.get("max") ?? "",
    inStock: params.get("stock") === "1",
  };

  const patch = (next: Partial<BrowseState>) => {
    const merged = { ...state, ...next };
    const p = new URLSearchParams();
    if (merged.q) p.set("q", merged.q);
    if (merged.sort && merged.sort !== "newest") p.set("sort", merged.sort);
    if (merged.max) p.set("max", merged.max);
    if (merged.inStock) p.set("stock", "1");
    setParams(p, { replace: true });
  };

  useSeo({
    title: category ? `${category.name} | Noble Spaces Shop` : "Shop collection | Noble Spaces",
    description:
      category?.description ??
      "Browse this collection of furniture and interior products from Noble Spaces Rwanda.",
    path: `/shop/category/${slug ?? ""}`,
  });

  if (!loadingCats && !category) {
    return (
      <div className="pt-28">
        <section className="mx-auto max-w-3xl px-6 py-24 text-center lg:px-10">
          <h1 className="font-display text-4xl">Collection not found</h1>
          <p className="mt-4 text-muted-foreground">This collection may have been renamed or removed.</p>
          <Link to="/shop" className="mt-6 inline-block text-sm uppercase tracking-[0.25em] text-gold hover:underline">
            Back to shop
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/shop" className="hover:text-gold">
            Shop
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gold">{category?.name ?? "…"}</span>
        </nav>

        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight lg:text-6xl">
          {category?.name ?? "Collection"}
        </h1>
        {category?.description && (
          <p className="mt-4 max-w-2xl text-muted-foreground">{category.description}</p>
        )}

        <ProductBrowser
          products={products}
          isLoading={isLoading || loadingCats}
          isError={isError}
          state={state}
          onChange={patch}
        />
      </section>
    </div>
  );
};

export default CategoryPage;
