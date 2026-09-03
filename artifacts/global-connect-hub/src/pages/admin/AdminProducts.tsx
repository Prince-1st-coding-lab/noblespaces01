import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EmptyState, PageHeader, StatusChip } from "@/components/admin/AdminUi";
import {
  formatRwf,
  uploadProductImage,
  useProductCategories,
  useProducts,
  type Product,
} from "@/hooks/useProducts";

type Draft = {
  id?: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: string;
  compare_at_price: string;
  category_id: string;
  stock: string;
  low_stock_threshold: string;
  sort_order: string;
  active: boolean;
  featured: boolean;
  trending: boolean;
  images: string[];
};

const emptyDraft = (): Draft => ({
  name: "",
  slug: "",
  short_description: "",
  description: "",
  price: "",
  compare_at_price: "",
  category_id: "",
  stock: "0",
  low_stock_threshold: "3",
  sort_order: "0",
  active: true,
  featured: false,
  trending: false,
  images: [],
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const AdminProducts = () => {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useProducts({ includeInactive: true });
  const { data: categories = [] } = useProductCategories(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  const openNew = () => {
    setDraft(emptyDraft());
    setPreviews({});
    setOpen(true);
  };

  const openEdit = async (p: Product) => {
    const { data, error } = await supabase.from("products").select("*").eq("id", p.id).maybeSingle();
    if (error || !data) {
      toast({ title: "Could not load product", description: error?.message, variant: "destructive" });
      return;
    }
    const rawImages = Array.isArray(data.images) ? (data.images as string[]) : [];
    const map: Record<string, string> = {};
    rawImages.forEach((raw, i) => {
      if (p.images[i]) map[raw] = p.images[i];
    });
    setPreviews(map);
    setDraft({
      id: data.id,
      name: data.name,
      slug: data.slug,
      short_description: data.short_description ?? "",
      description: data.description ?? "",
      price: String(data.price ?? 0),
      compare_at_price: data.compare_at_price ? String(data.compare_at_price) : "",
      category_id: data.category_id ?? "",
      stock: String(data.stock ?? 0),
      low_stock_threshold: String(data.low_stock_threshold ?? 3),
      sort_order: String(data.sort_order ?? 0),
      active: !!data.active,
      featured: !!data.featured,
      trending: !!data.trending,
      images: rawImages,
    });
    setOpen(true);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        paths.push(await uploadProductImage(file));
      }
      const { data } = await supabase.storage.from("media").createSignedUrls(paths, 60 * 60);
      const map: Record<string, string> = {};
      (data ?? []).forEach((d) => {
        if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
      });
      setPreviews((prev) => ({ ...prev, ...map }));
      setDraft((d) => ({ ...d, images: [...d.images, ...paths] }));
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    const name = draft.name.trim();
    if (!name) return toast({ title: "Name is required", variant: "destructive" });
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 0) {
      return toast({ title: "Enter a valid price", variant: "destructive" });
    }

    const payload = {
      name,
      slug: slugify(draft.slug || name),
      short_description: draft.short_description.trim() || null,
      description: draft.description.trim() || null,
      price: Math.round(price),
      compare_at_price: draft.compare_at_price ? Math.round(Number(draft.compare_at_price)) : null,
      category_id: draft.category_id || null,
      images: draft.images,
      stock: Math.max(0, Math.round(Number(draft.stock) || 0)),
      low_stock_threshold: Math.max(0, Math.round(Number(draft.low_stock_threshold) || 0)),
      sort_order: Math.round(Number(draft.sort_order) || 0),
      active: draft.active,
      featured: draft.featured,
      trending: draft.trending,
      currency: "RWF",
    };

    setSaving(true);
    const { error } = draft.id
      ? await supabase.from("products").update(payload).eq("id", draft.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);

    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: draft.id ? "Product updated" : "Product added" });
    setOpen(false);
    refresh();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Product deleted" });
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Add, edit and manage everything customers can buy in the shop."
        action={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Add product
          </Button>
        }
      />

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : products.length === 0 ? (
        <EmptyState text="No products yet. Add your first product to open the shop." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="flex gap-4 rounded-xl border border-border p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.images[0] ? (
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium">{p.name}</p>
                  <StatusChip status={p.active ? "active" : "hidden"} />
                </div>
                <p className="mt-1 text-sm text-gold">{formatRwf(p.price)}</p>
                <p className="text-xs text-muted-foreground">
                  {(p.category_id && categoryName.get(p.category_id)) || "Uncategorised"} · {p.stock} in stock
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Oak dining table"
                />
              </div>
              <div>
                <Label>URL slug</Label>
                <Input
                  value={draft.slug}
                  onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                  placeholder="auto from name"
                />
              </div>
            </div>

            <div>
              <Label>Short description</Label>
              <Input
                value={draft.short_description}
                onChange={(e) => setDraft((d) => ({ ...d, short_description: e.target.value }))}
                placeholder="Shown on cards and in search results"
              />
            </div>

            <div>
              <Label>Full description</Label>
              <Textarea
                rows={4}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Price (RWF)</Label>
                <Input
                  inputMode="numeric"
                  value={draft.price}
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                />
              </div>
              <div>
                <Label>Compare at</Label>
                <Input
                  inputMode="numeric"
                  value={draft.compare_at_price}
                  onChange={(e) => setDraft((d) => ({ ...d, compare_at_price: e.target.value }))}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  inputMode="numeric"
                  value={draft.stock}
                  onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Category</Label>
                <Select
                  value={draft.category_id || "none"}
                  onValueChange={(v) => setDraft((d) => ({ ...d, category_id: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorised</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Low stock alert</Label>
                <Input
                  inputMode="numeric"
                  value={draft.low_stock_threshold}
                  onChange={(e) => setDraft((d) => ({ ...d, low_stock_threshold: e.target.value }))}
                />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input
                  inputMode="numeric"
                  value={draft.sort_order}
                  onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              {(["active", "featured", "trending"] as const).map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm capitalize">
                  <Switch
                    checked={draft[k]}
                    onCheckedChange={(v) => setDraft((d) => ({ ...d, [k]: v }))}
                  />
                  {k}
                </label>
              ))}
            </div>

            <div>
              <Label>Images</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {draft.images.map((raw) => (
                  <div key={raw} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                    {previews[raw] || raw.startsWith("http") ? (
                      <img src={previews[raw] ?? raw} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                        image
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, images: d.images.filter((i) => i !== raw) }))}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground"
                  aria-label="Upload images"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {draft.id ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminProducts;
