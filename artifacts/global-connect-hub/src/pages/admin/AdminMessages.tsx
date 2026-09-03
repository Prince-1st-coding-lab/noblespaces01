import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EmptyState, PageHeader, StatusChip } from "@/components/admin/AdminUi";

type Message = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

const AdminMessages = () => {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-messages"] });

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    refresh();
  };

  return (
    <>
      <PageHeader title="Messages" description="Enquiries sent through the contact form." />
      {q.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !q.data?.length ? (
        <EmptyState text="No messages yet." />
      ) : (
        <div className="grid gap-2">
          {q.data.map((m) => (
            <div key={m.id} className="rounded-lg border border-gold/20 bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {m.name}
                  {m.subject ? ` — ${m.subject}` : ""}
                </span>
                <StatusChip status={m.status} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {m.phone && <span>{m.phone}</span>}
                {m.email && <span>{m.email}</span>}
                <span>{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{m.message}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {["new", "read", "replied"]
                  .filter((s) => s !== m.status)
                  .map((s) => (
                    <Button key={s} size="sm" variant="outline" className="h-7 text-xs" onClick={() => update(m.id, s)}>
                      {s}
                    </Button>
                  ))}
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => remove(m.id)}>
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

export default AdminMessages;
