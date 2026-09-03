import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EmptyState, PageHeader, StatusChip } from "@/components/admin/AdminUi";

type Quote = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  service_slug: string | null;
  details: string | null;
  budget: string | null;
  status: string;
  created_at: string;
};

const AdminQuotes = () => {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Quote[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-quotes"] });

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("quote_requests").update({ status }).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("quote_requests").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    refresh();
  };

  return (
    <>
      <PageHeader title="Quotations" description="Quote requests submitted from the website." />
      {q.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !q.data?.length ? (
        <EmptyState text="No quotation requests yet." />
      ) : (
        <div className="grid gap-2">
          {q.data.map((r) => (
            <div key={r.id} className="rounded-lg border border-gold/20 bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{r.name}</span>
                <StatusChip status={r.status} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {r.phone && <span>{r.phone}</span>}
                {r.email && <span>{r.email}</span>}
                {r.service_slug && <span>service: {r.service_slug}</span>}
                {r.budget && <span>budget: {r.budget}</span>}
                <span>{new Date(r.created_at).toLocaleString()}</span>
              </div>
              {r.details && <p className="mt-1 whitespace-pre-wrap">{r.details}</p>}
              <div className="mt-2 flex flex-wrap gap-1">
                {["new", "contacted", "quoted", "closed"]
                  .filter((s) => s !== r.status)
                  .map((s) => (
                    <Button key={s} size="sm" variant="outline" className="h-7 text-xs" onClick={() => update(r.id, s)}>
                      {s}
                    </Button>
                  ))}
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => remove(r.id)}>
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

export default AdminQuotes;
