import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EmptyState, PageHeader, StatusChip } from "@/components/admin/AdminUi";

type Order = {
  id: string;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  service_slug: string | null;
  item_name: string | null;
  amount: number;
  total: number | null;
  delivery_fee: number | null;
  status: string;
  payment_method: string | null;
  paypack_ref: string | null;
  country: string | null;
  province: string | null;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  street_address: string | null;
  delivery_instructions: string | null;
  created_at: string;
};

const STATUSES = ["pending", "processing", "completed", "cancelled", "failed"];

const AdminOrders = () => {
  const qc = useQueryClient();
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: `Order marked ${status}` });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const address = (o: Order) =>
    [o.street_address, o.village, o.cell, o.sector, o.district, o.province, o.country]
      .filter(Boolean)
      .join(", ");

  return (
    <>
      <PageHeader title="Orders" description="Every payment and product order, with delivery details." />
      {orders.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !orders.data?.length ? (
        <EmptyState text="No orders yet." />
      ) : (
        <div className="grid gap-2">
          {orders.data.map((o) => (
            <div key={o.id} className="rounded-lg border border-gold/20 bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{o.customer_name || o.email || "—"}</span>
                <StatusChip status={o.status} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {o.phone && <span>{o.phone}</span>}
                {o.email && <span>{o.email}</span>}
                {o.service_slug && <span>service: {o.service_slug}</span>}
                {o.item_name && <span>{o.item_name}</span>}
                <span>RWF {Number(o.total || o.amount).toLocaleString()}</span>
                {!!o.delivery_fee && <span>delivery: RWF {Number(o.delivery_fee).toLocaleString()}</span>}
                {o.payment_method && <span>{o.payment_method}</span>}
                {o.paypack_ref && <span>ref: {o.paypack_ref}</span>}
                <span>{new Date(o.created_at).toLocaleString()}</span>
              </div>
              {address(o) && <div className="mt-1 text-xs">Deliver to: {address(o)}</div>}
              {o.delivery_instructions && (
                <div className="text-xs text-muted-foreground">Note: {o.delivery_instructions}</div>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {STATUSES.filter((s) => s !== o.status).map((s) => (
                  <Button key={s} size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(o.id, s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default AdminOrders;
