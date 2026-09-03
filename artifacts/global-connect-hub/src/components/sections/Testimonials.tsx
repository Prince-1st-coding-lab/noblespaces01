import { useRef, useState } from "react";
import { Loader2, Quote, Star, Upload } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadTestimonialAvatar, useApprovedTestimonials, type Testimonial } from "@/hooks/useTestimonials";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255).or(z.literal("")),
  role_label: z.string().trim().max(80, "Too long"),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10, "Please write at least 10 characters").max(1000, "Keep it under 1000 characters"),
});

const Stars = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-1" role={onChange ? "radiogroup" : undefined} aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => {
      const filled = n <= value;
      const cls = `h-4 w-4 ${filled ? "fill-gold text-gold" : "text-muted-foreground"}`;
      return onChange ? (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-checked={value === n} role="radio">
          <Star className={`${cls} h-6 w-6 transition-transform hover:scale-110`} />
        </button>
      ) : (
        <Star key={n} className={cls} aria-hidden="true" />
      );
    })}
  </div>
);

const Card = ({ t }: { t: Testimonial }) => (
  <figure className="flex h-full flex-col gap-4 rounded-3xl border border-gold/15 bg-card p-6 transition-colors hover:border-gold/40">
    <Quote className="h-6 w-6 text-gold" aria-hidden="true" />
    <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">{t.body}</blockquote>
    <Stars value={t.rating} />
    <figcaption className="flex items-center gap-3 border-t border-border pt-4">
      {t.image_url ? (
        <img src={t.image_url} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 font-display text-gold">
          {t.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span>
        <span className="block font-display text-base">{t.name}</span>
        {t.role_label && <span className="block text-xs text-muted-foreground">{t.role_label}</span>}
      </span>
    </figcaption>
  </figure>
);

const SubmitDialog = () => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", email: "", role_label: "", body: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, rating });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v?.[0] ?? ""])));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Image must be smaller than 5MB");
        image_url = await uploadTestimonialAvatar(file);
      }
      const { error } = await supabase.from("testimonials").insert({
        name: parsed.data.name,
        email: parsed.data.email || null,
        role_label: parsed.data.role_label || null,
        rating: parsed.data.rating,
        body: parsed.data.body,
        image_url,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "Thank you!", description: "Your testimonial was submitted and will appear once approved." });
      setForm({ name: "", email: "", role_label: "", body: "" });
      setRating(5);
      setFile(null);
      setOpen(false);
    } catch (err) {
      toast({
        title: "Could not submit",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Share your experience</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Write a testimonial</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Full name *</Label>
            <Input id="t-name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-email">Email</Label>
            <Input id="t-email" type="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-role">Role / company (optional)</Label>
            <Input id="t-role" value={form.role_label} onChange={set("role_label")} />
          </div>
          <div className="space-y-1.5">
            <Label>Rating *</Label>
            <Stars value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-body">Your testimonial *</Label>
            <Textarea id="t-body" rows={5} value={form.body} onChange={set("body")} aria-invalid={!!errors.body} />
            {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Profile photo (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-3.5 w-3.5" /> {file ? file.name.slice(0, 28) : "Choose image"}
            </Button>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit testimonial
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const Testimonials = ({ preview = false }: { preview?: boolean }) => {
  const { data = [], isLoading, isError } = useApprovedTestimonials();
  const items = preview ? data.slice(0, 3) : data;

  return (
    <section aria-labelledby="testimonials-heading" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold">— Testimonials</span>
          <h2 id="testimonials-heading" className="mt-3 font-display text-4xl font-semibold lg:text-5xl">
            What our clients say
          </h2>
        </div>
        <SubmitDialog />
      </div>

      {isError ? (
        <p className="mt-10 rounded-3xl border border-destructive/30 p-8 text-center text-sm text-muted-foreground">
          We couldn't load testimonials right now. Please refresh the page.
        </p>
      ) : isLoading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-3xl" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-gold/25 p-12 text-center text-sm text-muted-foreground">
          No testimonials yet — be the first to share your experience.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => <Card key={t.id} t={t} />)}
        </div>
      )}
    </section>
  );
};
