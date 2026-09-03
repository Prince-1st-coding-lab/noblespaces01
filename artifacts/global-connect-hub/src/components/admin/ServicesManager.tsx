import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/admin/AdminUi";

type Availability = "both" | "custom" | "service";

type ServiceRow = {
  slug: string;
  title: string | null;
  description: string | null;
  icon: string | null;
  availability: Availability;
  lead_time_min: number;
  lead_time_max: number;
  sort_order: number;
  hidden: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const ServicesManager = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ServiceRow[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "services"] });
    qc.invalidateQueries({ queryKey: ["services", "catalog"] });
  };

  const toggleHidden = async (s: ServiceRow) => {
    const { error } = await supabase
      .from("services")
      .update({ hidden: !s.hidden })
      .eq("slug", s.slug);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    refresh();
  };

  const remove = async (s: ServiceRow) => {
    if (!confirm(`Delete "${s.title ?? s.slug}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("services").delete().eq("slug", s.slug);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Service deleted" });
    refresh();
  };

  return (
    <div className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Services</h2>
          <p className="text-xs text-muted-foreground">
            Add, edit, hide or delete services. Hidden services don't appear on the public site.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-gold text-primary-foreground hover:bg-gold/90">
          <Plus className="mr-2 h-4 w-4" /> Add service
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-2" aria-label="Loading services">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card/60" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-muted-foreground">
          Services could not be loaded. Refresh the page and try again.
        </p>
      ) : !(data ?? []).length ? (
        <EmptyState text="No services yet. Add the first service to begin." />
      ) : (
        <div className="grid gap-2">
          {(data ?? []).map((s) => (
            <div
              key={s.slug}
              className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
                s.hidden ? "border-muted bg-muted/20 opacity-70" : "border-gold/20 bg-card"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {s.title ?? s.slug}
                  {s.hidden && <span className="ml-2 text-xs text-muted-foreground">(hidden)</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.slug} · {s.availability} · {s.lead_time_min}–{s.lead_time_max} days · order {s.sort_order}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => toggleHidden(s)} title={s.hidden ? "Show" : "Hide"}>
                {s.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                <Pencil className="mr-2 h-3 w-3" /> Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(s)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ServiceDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false); } }}
        existing={editing}
        onSaved={() => { setEditing(null); setCreating(false); refresh(); }}
      />
    </div>
  );
};

const DEFAULTS: ServiceRow = {
  slug: "",
  title: "",
  description: "",
  icon: "Sparkles",
  availability: "service",
  lead_time_min: 3,
  lead_time_max: 14,
  sort_order: 500,
  hidden: false,
};

const ServiceDialog = ({
  open, onOpenChange, existing, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing: ServiceRow | null;
  onSaved: () => void;
}) => {
  const isNew = !existing;
  const [form, setForm] = useState<ServiceRow>(DEFAULTS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(existing ?? DEFAULTS);
  }, [open, existing]);

  const set = <K extends keyof ServiceRow>(k: K, v: ServiceRow[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const slug = isNew ? slugify(form.slug || form.title || "") : form.slug;
    if (!slug) {
      toast({ title: "Slug or title is required", variant: "destructive" });
      return;
    }
    if (!form.title?.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (form.lead_time_max < form.lead_time_min) {
      toast({ title: "Lead time max must be ≥ min", variant: "destructive" });
      return;
    }
    setBusy(true);
    const payload = {
      slug,
      title: form.title?.trim() || null,
      description: form.description?.trim() || null,
      icon: form.icon?.trim() || null,
      availability: form.availability,
      lead_time_min: Number(form.lead_time_min) || 1,
      lead_time_max: Number(form.lead_time_max) || 1,
      sort_order: Number(form.sort_order) || 500,
      hidden: form.hidden,
    };
    const { error } = isNew
      ? await supabase.from("services").insert(payload)
      : await supabase.from("services").update(payload).eq("slug", existing!.slug);
    setBusy(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isNew ? "Service created" : "Service updated" });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add service" : `Edit ${existing?.title ?? existing?.slug}`}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </div>
          {isNew && (
            <div className="space-y-1.5">
              <Label>Slug (auto from title if empty)</Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="e.g. custom-shelving"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Icon name (lucide-react)</Label>
              <Input
                value={form.icon ?? ""}
                onChange={(e) => set("icon", e.target.value)}
                placeholder="Sparkles"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Availability</Label>
              <Select
                value={form.availability}
                onValueChange={(v) => set("availability", v as Availability)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">On-site service</SelectItem>
                  <SelectItem value="custom">Made to order</SelectItem>
                  <SelectItem value="both">Stock + custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Lead time min (days)</Label>
              <Input
                type="number" min={1}
                value={form.lead_time_min}
                onChange={(e) => set("lead_time_min", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lead time max (days)</Label>
              <Input
                type="number" min={1}
                value={form.lead_time_max}
                onChange={(e) => set("lead_time_max", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={!form.hidden} onCheckedChange={(v) => set("hidden", !v)} id="visible" />
                <Label htmlFor="visible">Visible on site</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="bg-gold text-primary-foreground hover:bg-gold/90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isNew ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
