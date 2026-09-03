import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload, ImagePlus, Replace } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { SERVICES } from "@/data/services";

type Photo = {
  id: string;
  service_slug: string;
  storage_path: string;
  created_at: string;
  signedUrl?: string;
};

const humanize = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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

export const ServicePhotoManager = () => {
  const [slug, setSlug] = useState<string>(SERVICES[0]?.slug ?? "");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [replacing, setReplacing] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<Photo | null>(null);

  const load = async (s: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_photos")
      .select("id,service_slug,storage_path,created_at")
      .eq("service_slug", s)
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

  useEffect(() => {
    if (slug) load(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const onUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast({ title: "Not signed in", description: "Please sign in again.", variant: "destructive" });
      return;
    }
    setUploading(true);
    let ok = 0;
    let failed = 0;
    const firstError: { title: string; msg: string } = { title: "", msg: "" };

    for (const file of Array.from(files)) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${slug}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("service-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) {
        failed++;
        if (!firstError.title) { firstError.title = "Storage upload failed"; firstError.msg = upErr.message; }
        continue;
      }
      const { error: dbErr } = await supabase.from("service_photos").insert({
        service_slug: slug,
        storage_path: path,
        public_url: path,
      });
      if (dbErr) {
        failed++;
        if (!firstError.title) { firstError.title = "Database insert failed"; firstError.msg = dbErr.message; }
        await supabase.storage.from("service-photos").remove([path]);
        continue;
      }
      ok++;
    }
    setUploading(false);
    if (uploadRef.current) uploadRef.current.value = "";

    if (ok) toast({ title: `${ok} photo${ok > 1 ? "s" : ""} uploaded` });
    if (failed) {
      toast({
        title: `${failed} file(s) failed`,
        description: firstError.msg || "Check that you are signed in as an admin.",
        variant: "destructive",
      });
    }
    load(slug);
  };

  const removePhoto = async (p: Photo) => {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    setDeleting(p.id);
    const { error: sErr } = await supabase.storage.from("service-photos").remove([p.storage_path]);
    const { error: dErr } = await supabase.from("service_photos").delete().eq("id", p.id);
    setDeleting(null);
    if (sErr || dErr) {
      toast({
        title: "Delete failed",
        description: sErr?.message || dErr?.message,
        variant: "destructive",
      });
      return;
    }
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
    toast({ title: "Photo deleted" });
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
      toast({ title: "Update failed", description: dbErr.message, variant: "destructive" });
      return;
    }
    // remove old file
    await supabase.storage.from("service-photos").remove([target.storage_path]);
    setReplacing(null);
    if (replaceRef.current) replaceRef.current.value = "";
    toast({ title: "Photo replaced" });
    load(slug);
  };

  return (
    <div className="mt-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Service photos</h2>
          <p className="text-xs text-muted-foreground">
            Upload, replace or delete photos shown in each service's gallery.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={slug} onValueChange={setSlug}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {SERVICES.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>{humanize(s.slug)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
          <input
            ref={replaceRef}
            type="file"
            accept="image/*"
            className="hidden"
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
          <ImagePlus className="h-4 w-4" />
          No custom photos yet for {humanize(slug)}. Uploaded photos will appear on the service page.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-lg border border-gold/15">
              {p.signedUrl ? (
                <img src={p.signedUrl} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-secondary/40 text-xs text-muted-foreground">
                  Preview unavailable
                </div>
              )}
              <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  title="Replace"
                  disabled={replacing === p.id}
                  onClick={() => triggerReplace(p)}
                >
                  {replacing === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Replace className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  title="Delete"
                  disabled={deleting === p.id}
                  onClick={() => removePhoto(p)}
                >
                  {deleting === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
