import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbox } from "@/components/Lightbox";
import { useCart } from "@/context/CartContext";
import { useSeo } from "@/hooks/useSeo";
import { formatRwf, useProduct, useProducts } from "@/hooks/useProducts";
import { ProductCard } from "./ShopPage";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug);
  const { data: all = [] } = useProducts();
  const { add } = useCart();
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useSeo({
    title: product ? `${product.name} | Noble Spaces` : "Product | Noble Spaces",
    description:
      product?.short_description ??
      product?.description?.slice(0, 155) ??
      "Quality furniture and interior products from Noble Spaces Rwanda.",
    path: `/shop/${slug}`,
    type: "product",
    image: product?.images?.[0] ?? null,
    jsonLd: product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.short_description ?? product.description ?? undefined,
          image: product.images,
          sku: product.slug,
          brand: { "@type": "Brand", name: "Noble Spaces" },
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency || "RWF",
            availability:
              product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url: `https://noblespaces.rw/shop/${product.slug}`,
          },
        }
      : null,
  });


  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-32 lg:px-10">
        <Skeleton className="h-[420px] rounded-3xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-3xl">Product not found</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [];
  const related = all.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 3);
  const soldOut = product.stock <= 0;

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <Link to="/shop" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Shop
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <div>
            <button
              type="button"
              onClick={() => images.length > 0 && setLightbox(active)}
              className="block aspect-[4/3] w-full overflow-hidden rounded-3xl border border-gold/15 bg-muted"
            >
              {images[active] ? (
                <img src={images[active]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</span>
              )}
            </button>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map((src, i) => (
                  <button key={src + i} onClick={() => setActive(i)}
                    className={`aspect-square overflow-hidden rounded-xl border ${i === active ? "border-gold" : "border-border"}`}>
                    <img src={src} alt={`${product.name} ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight lg:text-5xl">{product.name}</h1>
            <div className="mt-4 flex items-center gap-3">
              <span className="font-display text-3xl text-gold">{formatRwf(product.price)}</span>
              {product.compare_at_price ? (
                <span className="text-sm text-muted-foreground line-through">{formatRwf(product.compare_at_price)}</span>
              ) : null}
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {soldOut ? "Out of stock" : `${product.stock} in stock`}
            </p>

            {product.description && (
              <p className="mt-6 whitespace-pre-line text-muted-foreground">{product.description}</p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                disabled={soldOut}
                onClick={() =>
                  add({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image: images[0] })
                }
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> {soldOut ? "Sold out" : "Add to cart"}
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/checkout">Checkout</Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-gold/15 p-4 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 text-gold" />
              Delivery across Kigali and nationwide — fee confirmed at checkout.
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display text-3xl">You may also like</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </section>

      <Lightbox
        items={images.map((src, i) => ({ src, alt: `${product.name} ${i + 1}` }))}
        index={lightbox ?? 0}
        open={lightbox !== null}
        onClose={() => setLightbox(null)}
        onIndexChange={(i) => setLightbox(i)}
      />
    </div>
  );
};

export default ProductDetail;
