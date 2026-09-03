import { useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/hooks/useProducts";

export type BrowseState = {
  q: string;
  sort: string;
  max: string;
  inStock: boolean;
};

export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

export const applyBrowse = (products: Product[], state: BrowseState): Product[] => {
  const q = state.q.trim().toLowerCase();
  const max = Number(state.max);
  let out = products.filter((p) => {
    if (q && !`${p.name} ${p.short_description ?? ""}`.toLowerCase().includes(q)) return false;
    if (state.inStock && p.stock <= 0) return false;
    if (state.max && Number.isFinite(max) && max > 0 && p.price > max) return false;
    return true;
  });

  out = [...out];
  if (state.sort === "price-asc") out.sort((a, b) => a.price - b.price);
  else if (state.sort === "price-desc") out.sort((a, b) => b.price - a.price);
  else if (state.sort === "name") out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
};

export const ProductBrowser = ({
  products,
  isLoading,
  isError,
  state,
  onChange,
}: {
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
  state: BrowseState;
  onChange: (patch: Partial<BrowseState>) => void;
}) => {
  const results = useMemo(() => applyBrowse(products, state), [products, state]);

  if (isError) {
    return (
      <p className="mt-12 rounded-3xl border border-destructive/30 p-12 text-center text-sm text-muted-foreground">
        We couldn't load products right now. Please refresh the page or try again shortly.
      </p>
    );
  }

  return (
    <>
      <div className="mt-8 grid gap-3 rounded-2xl border border-gold/15 bg-card/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={state.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Search products"
            aria-label="Search products"
            className="pl-9"
          />
        </div>

        <Select value={state.sort} onValueChange={(v) => onChange({ sort: v })}>
          <SelectTrigger aria-label="Sort products">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            inputMode="numeric"
            value={state.max}
            onChange={(e) => onChange({ max: e.target.value.replace(/[^0-9]/g, "") })}
            placeholder="Max price (RWF)"
            aria-label="Maximum price"
            className="pl-9"
          />
        </div>

        <label className="flex items-center justify-between gap-3 rounded-md border border-input px-3 py-2 text-sm">
          In stock only
          <Switch checked={state.inStock} onCheckedChange={(v) => onChange({ inStock: v })} />
        </label>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {isLoading ? "Loading…" : `${results.length} product${results.length === 1 ? "" : "s"}`}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-3xl" />)
          : results.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {!isLoading && results.length === 0 && (
        <p className="mt-12 rounded-3xl border border-dashed border-gold/25 p-12 text-center text-sm text-muted-foreground">
          No products match your filters — try clearing the search or price limit.
        </p>
      )}
    </>
  );
};
