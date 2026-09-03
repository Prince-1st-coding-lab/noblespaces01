import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { formatRwf } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { notifyAdminEmail } from "@/lib/notify";


const DELIVERY_FEES: Record<string, number> = { Kigali: 5000, Other: 15000 };

const PAYMENT_METHODS = [
  { value: "momo", label: "Mobile Money (MoMo Pay 0793521437 — NOBLE SPACES Ltd)" },
  { value: "bank", label: "Bank transfer (4002201390383 — NOBLE SPACES Ltd)" },
  { value: "cod", label: "Cash on delivery" },
];

const schema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a valid phone number")
    .max(20, "Phone number is too long")
    .regex(/^[0-9+\s()-]+$/, "Phone can only contain digits and + ( ) -"),
  country: z.string().trim().min(2, "Country is required").max(60),
  province: z.string().trim().min(2, "Province / State is required").max(60),
  district: z.string().trim().min(2, "District is required").max(60),
  city: z.string().trim().min(2, "City / Town is required").max(60),
  sector: z.string().trim().min(2, "Sector is required").max(60),
  cell: z.string().trim().min(2, "Cell is required").max(60),
  village: z.string().trim().min(2, "Village is required").max(60),
  street_address: z.string().trim().min(2, "Street address / house number is required").max(160),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  delivery_instructions: z.string().trim().max(500, "Keep it under 500 characters").optional().or(z.literal("")),
  payment_method: z.string().min(1),
});

type FormState = z.infer<typeof schema>;

const initial: FormState = {
  customer_name: "",
  email: "",
  phone: "",
  country: "Rwanda",
  province: "Kigali",
  district: "",
  city: "",
  sector: "",
  cell: "",
  village: "",
  street_address: "",
  postal_code: "",
  delivery_instructions: "",
  payment_method: "momo",
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { lines, subtotal, clear, setQuantity, remove } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useSeo({
    title: "Checkout | Noble Spaces",
    description:
      "Complete your Noble Spaces order — mobile money, bank transfer or cash on delivery, with delivery across Rwanda.",
    path: "/checkout",
  });

  const deliveryFee = useMemo(
    () => (subtotal === 0 ? 0 : DELIVERY_FEES[form.province.trim().toLowerCase() === "kigali" ? "Kigali" : "Other"]),
    [form.province, subtotal],
  );
  const total = subtotal + deliveryFee;

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const field = (k: keyof FormState, label: string, opts: { required?: boolean; placeholder?: string; type?: string } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${k}`}>
        {label} {opts.required && <span className="text-gold">*</span>}
      </Label>
      <Input
        id={`f-${k}`}
        type={opts.type ?? "text"}
        placeholder={opts.placeholder}
        value={form[k] as string}
        onChange={set(k)}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `e-${k}` : undefined}
        className={errors[k] ? "border-destructive" : undefined}
      />
      {errors[k] && (
        <p id={`e-${k}`} className="text-xs text-destructive">
          {errors[k]}
        </p>
      )}
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return;

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      const next: Partial<Record<keyof FormState, string>> = {};
      (Object.keys(fe) as (keyof FormState)[]).forEach((k) => {
        next[k] = fe[k]?.[0];
      });
      setErrors(next);
      toast({ title: "Please complete the highlighted fields", variant: "destructive" });
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    setSubmitting(true);
    const d = parsed.data;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: d.customer_name,
        phone: d.phone,
        email: d.email,
        item_name: lines.map((l) => `${l.name} x${l.quantity}`).join(", "),
        amount: total,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: "pending",
        order_type: "product",
        payment_method: PAYMENT_METHODS.find((m) => m.value === d.payment_method)?.label ?? d.payment_method,
        country: d.country,
        province: d.province,
        district: d.district,
        city: d.city,
        sector: d.sector,
        cell: d.cell,
        village: d.village,
        street_address: d.street_address,
        postal_code: d.postal_code || null,
        delivery_instructions: d.delivery_instructions || null,
      })
      .select("id")
      .single();

    if (error || !order) {
      setSubmitting(false);
      toast({ title: "Could not place order", description: error?.message, variant: "destructive" });
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.productId,
        product_name: l.name,
        unit_price: l.price,
        quantity: l.quantity,
        line_total: l.price * l.quantity,
      })),
    );
    if (itemsError) {
      setSubmitting(false);
      toast({ title: "Order saved but items failed", description: itemsError.message, variant: "destructive" });
      return;
    }

    void notifyAdminEmail({
      event: "order",
      dedupeKey: `order-${order.id}`,
      subject: `New order #${order.id.slice(0, 8)} — ${formatRwf(total)}`,
      title: "New order received",
      lines: [
        { label: "Customer", value: d.customer_name },
        { label: "Phone", value: d.phone },
        { label: "Email", value: d.email },
        ...lines.map((l) => ({ label: `${l.name} × ${l.quantity}`, value: formatRwf(l.price * l.quantity) })),
        { label: "Delivery", value: formatRwf(deliveryFee) },
        { label: "Total", value: formatRwf(total) },
        { label: "Payment", value: PAYMENT_METHODS.find((m) => m.value === d.payment_method)?.label ?? d.payment_method },
        {
          label: "Address",
          value: [d.street_address, d.village, d.cell, d.sector, d.city, d.district, d.province, d.country]
            .filter(Boolean)
            .join(", "),
        },
      ],
    });


    setSubmitting(false);
    clear();
    toast({ title: "Order placed", description: "We'll call you shortly to confirm delivery and payment." });
    navigate("/payment-success");
  };

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">Add a product to continue to checkout.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/shop">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <h1 className="font-display text-4xl">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">Customer details, delivery address and payment preference.</p>

      <form onSubmit={submit} noValidate className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <fieldset className="space-y-4 rounded-2xl border border-gold/20 bg-card p-6">
            <legend className="px-2 font-display text-xl">Customer information</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("customer_name", "Full name", { required: true })}
              {field("phone", "Phone number", { required: true, placeholder: "07…" })}
              <div className="sm:col-span-2">{field("email", "Email address", { required: true, type: "email" })}</div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-2xl border border-gold/20 bg-card p-6">
            <legend className="px-2 font-display text-xl">Delivery information</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("country", "Country", { required: true })}
              {field("province", "Province / State", { required: true })}
              {field("district", "District", { required: true })}
              {field("city", "City / Town", { required: true })}
              {field("sector", "Sector", { required: true })}
              {field("cell", "Cell", { required: true })}
              {field("village", "Village", { required: true })}
              {field("street_address", "Street address / house number", { required: true })}
              {field("postal_code", "Postal code (optional)")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-instructions">Delivery instructions / landmark (optional)</Label>
              <Textarea
                id="f-instructions"
                rows={3}
                value={form.delivery_instructions}
                onChange={set("delivery_instructions")}
              />
              {errors.delivery_instructions && (
                <p className="text-xs text-destructive">{errors.delivery_instructions}</p>
              )}
            </div>
          </fieldset>

          <fieldset className="space-y-3 rounded-2xl border border-gold/20 bg-card p-6">
            <legend className="px-2 font-display text-xl">Payment method</legend>
            <RadioGroup
              value={form.payment_method}
              onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v }))}
            >
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  htmlFor={m.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:border-gold/50"
                >
                  <RadioGroupItem value={m.value} id={m.value} />
                  {m.label}
                </label>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">Online card payment will be available soon.</p>
          </fieldset>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-gold/20 bg-card p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-xl">Order summary</h2>
          <ul className="space-y-4">
            {lines.map((l) => (
              <li key={l.productId} className="flex gap-3">
                {l.image && (
                  <img src={l.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{formatRwf(l.price)} each</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${l.name}`}
                      onClick={() => setQuantity(l.productId, l.quantity - 1)}
                      className="rounded-md border border-border p-1 hover:border-gold"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${l.name}`}
                      onClick={() => setQuantity(l.productId, l.quantity + 1)}
                      className="rounded-md border border-border p-1 hover:border-gold"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${l.name}`}
                      onClick={() => remove(l.productId)}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <span className="text-sm">{formatRwf(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatRwf(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Delivery fee</span>
              <span>{formatRwf(deliveryFee)}</span>
            </div>
            <div className="mt-3 flex justify-between font-display text-lg text-gold">
              <span>Total</span>
              <span>{formatRwf(total)}</span>
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Place order
          </Button>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> No card details stored. We confirm every order by phone.
          </p>
        </aside>
      </form>
    </section>
  );
};

export default CheckoutPage;
