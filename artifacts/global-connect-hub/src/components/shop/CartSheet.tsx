import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { formatRwf } from "@/hooks/useProducts";

export const CartSheet = () => {
  const { lines, subtotal, setQuantity, remove, open, setOpen } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag className="h-4 w-4 text-gold" /> Your cart
          </SheetTitle>
        </SheetHeader>

        <div className="-mx-2 flex-1 overflow-y-auto px-2 py-4">
          {lines.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((l) => (
                <li key={l.productId} className="flex gap-3 rounded-xl border border-border p-3">
                  {l.image ? (
                    <img src={l.image} alt={l.name} loading="lazy" className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link to={`/shop/${l.slug}`} onClick={() => setOpen(false)} className="line-clamp-1 text-sm hover:text-gold">
                      {l.name}
                    </Link>
                    <div className="mt-1 text-xs text-muted-foreground">{formatRwf(l.price)}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Decrease quantity"
                        onClick={() => setQuantity(l.productId, l.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{l.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Increase quantity"
                        onClick={() => setQuantity(l.productId, l.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" aria-label="Remove item"
                        onClick={() => remove(l.productId)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter className="flex-col gap-3 sm:flex-col">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-display text-lg text-gold">{formatRwf(subtotal)}</span>
          </div>
          <Button asChild disabled={lines.length === 0} className="w-full">
            <Link to="/checkout" onClick={() => setOpen(false)}>Checkout</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
