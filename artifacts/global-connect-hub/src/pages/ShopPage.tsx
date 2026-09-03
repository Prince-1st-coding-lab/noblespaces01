import { Link, useSearchParams } from "react-router-dom";
import { useSeo } from "@/hooks/useSeo";
import { useProductCategories, useProducts } from "@/hooks/useProducts";
import { ProductBrowser, type BrowseState } from "@/components/shop/ProductBrowser";
import { ProductCard } from "@/components/shop/ProductCard";

export { ProductCard };

const ShopPage = () => {
  const [params, setParams] = useSearchParams();
  const { data: categories = [] } = useProductCategories();
  const categorySlug = params.get("category");
  const category = categories.find((c) => c.slug === categorySlug) ?? null;
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
    if (categorySlug) p.set("category", categorySlug);
    if (merged.q) p.set("q", merged.q);
    if (merged.sort && merged.sort !== "newest") p.set("sort", merged.sort);
    if (merged.max) p.set("max", merged.max);
    if (merged.inStock) p.set("stock", "1");
    setParams(p, { replace: true });
  };

  useSeo({
    title: "Shop Furniture & Interior Products | Noble Spaces",
    description:
      "Browse and buy furniture, décor and interior products from Noble Spaces Rwanda — delivered across Kigali.",
    path: "/shop",
  });

  const setCategory = (slug: string | null) => {
    const p = new URLSearchParams(params);
    if (slug) p.set("category", slug);
    else p.delete("category");
    setParams(p, { replace: true });
  };

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <span className="text-xs uppercase tracking-[0.3em] text-gold">— Shop</span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight lg:text-6xl">Our products</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Ready-made pieces from our workshop. Add to cart and check out with mobile money, bank transfer or
          cash on delivery.
        </p>

        {categories.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                !categorySlug
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:text-gold"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.slug)}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                  categorySlug === c.slug
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted-foreground hover:text-gold"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {category && (
          <p className="mt-4 text-sm text-muted-foreground">
            Viewing <span className="text-gold">{category.name}</span> ·{" "}
            <Link to={`/shop/category/${category.slug}`} className="underline hover:text-gold">
              open collection page
            </Link>
          </p>
        )}

        <ProductBrowser
          products={products}
          isLoading={isLoading}
          isError={isError}
          state={state}
          onChange={patch}
        />
      </section>
    </div>
  );
};

export default ShopPage;
