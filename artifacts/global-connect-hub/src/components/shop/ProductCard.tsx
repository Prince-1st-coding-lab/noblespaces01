import { Link } from "react-router-dom";
import { Eye, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { formatRwf, type Product } from "@/hooks/useProducts";

export const ProductCard = ({ product }: { product: Product }) => {
  const { add } = useCart();
  const image = product.images[0];
  const soldOut = product.stock <= 0;
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gold/15 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-deep">
      <Link
        to={`/shop/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
        aria-label={`View ${product.name}`}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.trending && (
            <span className="rounded-full bg-gold px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-primary-foreground">
              Trending
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-destructive px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-destructive-foreground">
              -{discount}%
            </span>
          )}
        </div>
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-background/85 py-2 text-center text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-lg leading-tight">
          <Link to={`/shop/${product.slug}`} className="transition-colors hover:text-gold">
            {product.name}
          </Link>
        </h3>
        {product.short_description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
        )}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-display text-xl text-gold">{formatRwf(product.price)}</span>
          {product.compare_at_price ? (
            <span className="text-xs text-muted-foreground line-through">{formatRwf(product.compare_at_price)}</span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button asChild size="sm" variant="outline">
            <Link to={`/shop/${product.slug}`}>
              <Eye className="mr-1.5 h-3.5 w-3.5" /> View
            </Link>
          </Button>
          <Button
            size="sm"
            disabled={soldOut}
            onClick={() =>
              add({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image })
            }
          >
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> {soldOut ? "Sold out" : "Add"}
          </Button>
        </div>
      </div>
    </article>
  );
};
