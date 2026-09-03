import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EmptyState, PageHeader, StatusChip } from "@/components/admin/AdminUi";

type Testimonial = {
  id: string;
  name: string;
  email: string | null;
  rating: number;
  body: string;
  image_url: string | null;
  role_label: string | null;
  status: string;
  created_at: string;
};

const AdminTestimonials = () => {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Testimonial[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("testimonials").update({ status }).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: `Testimonial ${status}` });
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Approve customer reviews before they appear on the website."
      />
      {q.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !q.data?.length ? (
        <EmptyState text="No testimonials submitted yet." />
      ) : (
        <div className="grid gap-2">
          {q.data.map((t) => (
            <div key={t.id} className="rounded-lg border border-gold/20 bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  {t.image_url && (
                    <img src={t.image_url} alt={t.name} className="h-8 w-8 rounded-full object-cover" />
                  )}
                  {t.name}
                  {t.role_label && <span className="text-xs text-muted-foreground">{t.role_label}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-gold">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                  <StatusChip status={t.status} />
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{t.body}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                {t.email && <span className="mr-3">{t.email}</span>}
                {new Date(t.created_at).toLocaleString()}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.status !== "approved" && (
                  <Button size="sm" className="h-7 text-xs" onClick={() => setStatus(t.id, "approved")}>
                    <Check className="mr-1 h-3 w-3" /> Approve
                  </Button>
                )}
                {t.status !== "rejected" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(t.id, "rejected")}>
                    <X className="mr-1 h-3 w-3" /> Reject
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => remove(t.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default AdminTestimonials;
