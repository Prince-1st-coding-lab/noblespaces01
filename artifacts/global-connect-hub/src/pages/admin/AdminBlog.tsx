import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  published_at: string | null;
};

type Draft = Omit<Post, "id" | "published_at"> & { id?: string };

const emptyDraft = (): Draft => ({
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  cover_url: "",
  seo_title: "",
  seo_description: "",
  published: false,
});

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const AdminBlog = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    qc.invalidateQueries({ queryKey: ["blog-posts-public"] });
  };

  const save = async () => {
    const title = draft.title.trim();
    if (!title) return toast({ title: "Title is required", variant: "destructive" });

    const payload = {
      title,
      slug: slugify(draft.slug || title),
      excerpt: draft.excerpt?.trim() || null,
      body: draft.body?.trim() || null,
      cover_url: draft.cover_url?.trim() || null,
      seo_title: draft.seo_title?.trim() || null,
      seo_description: draft.seo_description?.trim() || null,
      published: draft.published,
      published_at: draft.published ? new Date().toISOString() : null,
    };

    setSaving(true);
    const { error } = draft.id
      ? await supabase.from("blog_posts").update(payload).eq("id", draft.id)
      : await supabase.from("blog_posts").insert(payload);
    setSaving(false);

    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: draft.id ? "Article updated" : "Article created" });
    setOpen(false);
    refresh();
  };

  const remove = async (p: Post) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", p.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Article deleted" });
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Journal"
        description="Write and publish articles for the public journal."
        action={
          <Button
            onClick={() => {
              setDraft(emptyDraft());
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New article
          </Button>
        }
      />

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : posts.length === 0 ? (
        <EmptyState text="No articles yet." />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{p.title}</p>
                  <StatusChip status={p.published ? "approved" : "draft"} />
                </div>
                <p className="text-xs text-muted-foreground">/blog/{p.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDraft({ ...p, excerpt: p.excerpt ?? "", body: p.body ?? "" });
                    setOpen(true);
                  }}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit article" : "New article"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>URL slug</Label>
                <Input
                  value={draft.slug}
                  onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                  placeholder="auto from title"
                />
              </div>
            </div>

            <div>
              <Label>Cover image URL</Label>
              <Input
                value={draft.cover_url ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, cover_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Excerpt</Label>
              <Textarea
                rows={2}
                value={draft.excerpt ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
              />
            </div>

            <div>
              <Label>Body</Label>
              <Textarea
                rows={10}
                value={draft.body ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>SEO title</Label>
                <Input
                  value={draft.seo_title ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, seo_title: e.target.value }))}
                />
              </div>
              <div>
                <Label>SEO description</Label>
                <Input
                  value={draft.seo_description ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, seo_description: e.target.value }))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={draft.published}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, published: v }))}
              />
              Published
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminBlog;
