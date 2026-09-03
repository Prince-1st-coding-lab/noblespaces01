import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Trash2, Upload, Replace, ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Photo = {
  id: string;
  storage_path: string;
  signedUrl?: string;
};

async function signBatch(paths: string[]) {
  if (!paths.length) return {} as Record<string, string>;
  const { data, error } = await supabase.storage
    .from("service-photos")
    .createSignedUrls(paths, 60 * 60 * 24 * 7);
  if (error) return {};
  const map: Record<string, string> = {};
  (data ?? []).forEach((r) => {
    if (r.path && r.signedUrl) map[r.path] = r.signedUrl;
  });
  return map;
}

type Props = {
  slug: string;
  /** Called after any change (upload, delete, replace) so parent can refresh. */
  onChanged?: () => void;
};

/**
 * Admin-only inline photo controls that render on the service detail page.
 * Only mount this when the current user is confirmed admin.
 */
export const ServicePhotoAdminPanel = ({ slug, onChanged }: Props) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<Photo | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_photos")
      .select("id,storage_path")
      .eq("service_slug", slug)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load photos", description: error.message, variant: "destructive" });
      setPhotos([]);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Photo[];
    const urlMap = await signBatch(list.map((p) => p.storage_path));
    setPhotos(list.map((p) => ({ ...p, signedUrl: urlMap[p.storage_path] })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  // Dismiss active photo on Escape or click outside the panel
  const onDocClick = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    const panel = panelRef.current;
    if (panel && !panel.contains(target)) {
      setActivePhotoId(null);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePhotoId(null);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onDocClick]);

  const onUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    let ok = 0, failed = 0;
    let firstErr = "";
    for (const file of Array.from(files)) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${slug}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("service-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) { failed++; firstErr ||= upErr.message; continue; }
      const { error: dbErr } = await supabase.from("service_photos").insert({
        service_slug: slug,
        storage_path: path,
        public_url: path,
      });
      if (dbErr) {
        failed++; firstErr ||= dbErr.message;
        await supabase.storage.from("service-photos").remove([path]);
        continue;
      }
      ok++;
    }
    setUploading(false);
    if (uploadRef.current) uploadRef.current.value = "";
    if (ok) toast({ title: `${ok} photo${ok > 1 ? "s" : ""} uploaded` });
    if (failed) toast({ title: `${failed} failed`, description: firstErr, variant: "destructive" });
    await load();
    onChanged?.();
  };

  const removePhoto = async (p: Photo) => {
    if (!confirm("Delete this photo?")) return;
    setDeleting(p.id);
    await supabase.storage.from("service-photos").remove([p.storage_path]);
    const { error } = await supabase.from("service_photos").delete().eq("id", p.id);
    setDeleting(null);
    setActivePhotoId(null);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
    toast({ title: "Photo deleted" });
    onChanged?.();
  };

  const triggerReplace = (p: Photo) => {
    replaceTargetRef.current = p;
    replaceRef.current?.click();
  };

  const onReplace = async (files: FileList | null) => {
    const target = replaceTargetRef.current;
    replaceTargetRef.current = null;
    if (!files || !files.length || !target) return;
    const file = files[0];
    setReplacing(target.id);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const newPath = `${slug}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("service-photos")
      .upload(newPath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (upErr) {
      setReplacing(null);
      setActivePhotoId(null);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    const { error: dbErr } = await supabase
      .from("service_photos")
      .update({ storage_path: newPath, public_url: newPath })
      .eq("id", target.id);
    if (dbErr) {
      await supabase.storage.from("service-photos").remove([newPath]);
      setReplacing(null);
      setActivePhotoId(null);
      toast({ title: "Update failed", description: dbErr.message, variant: "destructive" });
      return;
    }
    await supabase.storage.from("service-photos").remove([target.storage_path]);
    setReplacing(null);
    setActivePhotoId(null);
    if (replaceRef.current) replaceRef.current.value = "";
    toast({ title: "Photo replaced" });
    await load();
    onChanged?.();
  };

  return (
    <div ref={panelRef} className="rounded-2xl border border-dashed border-gold/40 bg-card/40 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold/80">Admin</div>
          <h3 className="mt-1 font-display text-xl">Manage photos for this service</h3>
          <p className="text-xs text-muted-foreground">
            Only signed-in admins see this panel. Double-click a photo to edit or remove it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={uploadRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
          <input
            ref={replaceRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => onReplace(e.target.files)}
          />
          <Button
            type="button"
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            className="bg-gold text-primary-foreground hover:bg-gold/90"
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload photos
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : photos.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-gold/20 p-6 text-sm text-muted-foreground">
          <ImagePlus className="h-4 w-4" /> No uploaded photos yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-lg border border-gold/15 cursor-pointer"
              onDoubleClick={() => setActivePhotoId(p.id)}
            >
              {p.signedUrl ? (
                <img src={p.signedUrl} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-secondary/40 text-xs text-muted-foreground">
                  Preview unavailable
                </div>
              )}
              {activePhotoId === p.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="flex gap-2">
                    <Button size="icon" variant="secondary" className="h-9 w-9" title="Replace"
                      disabled={replacing === p.id} onClick={(e) => { e.stopPropagation(); triggerReplace(p); }}>
                      {replacing === p.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Replace className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="destructive" className="h-9 w-9" title="Delete"
                      disabled={deleting === p.id} onClick={(e) => { e.stopPropagation(); removePhoto(p); }}>
                      {deleting === p.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="outline" className="h-9 w-9 border-white/30 text-white hover:bg-white/20" title="Close"
                      onClick={(e) => { e.stopPropagation(); setActivePhotoId(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
