import { useRef, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EmptyState, PageHeader, StatusChip } from "@/components/admin/AdminUi";
import {
  uploadProductImage,
  useProductCategories,
  useProducts,
  type ProductCategory,
} from "@/hooks/useProducts";

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: string;
  active: boolean;
};

const emptyDraft = (): Draft => ({
  name: "",
  slug: "",
  description: "",
  image_url: "",
  sort_order: "0",
  active: true,
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const AdminCategories = () => {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useProductCategories(true);
  const { data: products = [] } = useProducts({ includeInactive: true });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [preview, setPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const countFor = (id: string) => products.filter((p) => p.category_id === id).length;
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["product-categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const openNew = () => {
    setDraft(emptyDraft());
    setPreview("");
    setOpen(true);
  };

  const openEdit = async (c: ProductCategory) => {
    setDraft({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image_url: c.image_url ?? "",
      sort_order: String(c.sort_order ?? 0),
      active: !!c.active,
    });
    if (c.image_url && !c.image_url.startsWith("http")) {
      const { data } = await supabase.storage.from("media").createSignedUrl(c.image_url, 3600);
      setPreview(data?.signedUrl ?? "");
    } else {
      setPreview(c.image_url ?? "");
    }
    setOpen(true);
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadProductImage(file);
      const { data } = await supabase.storage.from("media").createSignedUrl(path, 3600);
      setDraft((d) => ({ ...d, image_url: path }));
      setPreview(data?.signedUrl ?? "");
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

    const payload = {
      name,
      slug: slugify(draft.slug || name),
      description: draft.description.trim() || null,
      image_url: draft.image_url || null,
      sort_order: Math.round(Number(draft.sort_order) || 0),
      active: draft.active,
    };

    setSaving(true);
    const { error } = draft.id
      ? await supabase.from("product_categories").update(payload).eq("id", draft.id)
      : await supabase.from("product_categories").insert(payload);
    setSaving(false);

    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: draft.id ? "Category updated" : "Category added" });
    setOpen(false);
    refresh();
  };

  const remove = async (c: ProductCategory) => {
    const used = countFor(c.id);
    if (used > 0) {
      return toast({
        title: "Category in use",
        description: `${used} product(s) still belong to "${c.name}". Move them first, or hide the category instead.`,
        variant: "destructive",
      });
    }
    if (!confirm(`Delete "${c.name}"?`)) return;
    const { error } = await supabase.from("product_categories").delete().eq("id", c.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Category deleted" });
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group shop products into browsable collections."
        action={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Add category
          </Button>
        }
      />

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : categories.length === 0 ? (
        <EmptyState text="No categories yet. Add one to organise the shop." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-medium">{c.name}</p>
                <StatusChip status={c.active ? "active" : "hidden"} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                /shop/category/{c.slug} · {countFor(c.id)} product(s)
              </p>
              {c.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(c)} aria-label="Delete category">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Living room"
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
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Sort order</Label>
                <Input
                  inputMode="numeric"
                  value={draft.sort_order}
                  onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
                />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <Switch
                  checked={draft.active}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, active: v }))}
                />
                Visible in shop
              </label>
            </div>

            <div>
              <Label>Cover image</Label>
              <div className="mt-2 flex items-center gap-3">
                {draft.image_url ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                    {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : null}
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((d) => ({ ...d, image_url: "" }));
                        setPreview("");
                      }}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground"
                  aria-label="Upload cover image"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {draft.id ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminCategories;
