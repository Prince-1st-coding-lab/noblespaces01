import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useServices } from "@/hooks/useServices";
import { ServicesManager } from "@/components/admin/ServicesManager";
import { PageHeader } from "@/components/admin/AdminUi";

type ServicePrice = { slug: string; label: string; amount: number; active: boolean };

const PriceDialog = ({
  slug, existing, onSaved,
}: { slug: string; existing?: ServicePrice; onSaved: () => void }) => {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(existing?.label ?? "Service booking");
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? "");
  const [active, setActive] = useState(existing?.active ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLabel(existing?.label ?? "Service booking");
    setAmount(existing?.amount?.toString() ?? "");
    setActive(existing?.active ?? true);
  }, [open, existing]);

  const submit = async () => {
    const amt = Number(amount);
    if (!label.trim() || !Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Label and a positive amount are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("service_prices")
      .upsert({ slug, label: label.trim(), amount: amt, active }, { onConflict: "slug" });
    setBusy(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved" });
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-2 h-3 w-3" /> {existing ? "Edit" : "Set price"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Price for {slug}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>Label *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Consultation deposit" />
          </div>
          <div className="space-y-1.5">
            <Label>Amount (RWF) *</Label>
            <Input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} id="active" />
            <Label htmlFor="active">Show on booking dialog</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminServices = () => {
  const qc = useQueryClient();
  const { data: services } = useServices(true);

  const prices = useQuery({
    queryKey: ["service-prices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_prices").select("*");
      if (error) throw error;
      return (data ?? []) as ServicePrice[];
    },
  });

  const priceFor = (slug: string) => prices.data?.find((p) => p.slug === slug);

  return (
    <>
      <PageHeader
        title="Services"
        description="Add, edit, hide or delete services and set the amount customers pay online."
      />

      <ServicesManager />

      <div className="mt-10">
        <h2 className="font-display text-xl">Service prices</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Inactive services hide the online payment button.
        </p>
        {prices.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="grid gap-2">
            {services.map((s) => {
              const p = priceFor(s.slug);
              return (
                <div key={s.slug} className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/20 bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{s.title || s.slug}</div>
                    <div className="text-xs text-muted-foreground">
                      {p ? p.label : "no price set"} {p && !p.active && "(inactive)"}
                    </div>
                  </div>
                  <span className="rounded bg-gold/15 px-2 py-1 text-sm text-gold">
                    {p ? `RWF ${Number(p.amount).toLocaleString()}` : "—"}
                  </span>
                  <PriceDialog
                    slug={s.slug}
                    existing={p}
                    onSaved={() => qc.invalidateQueries({ queryKey: ["service-prices"] })}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminServices;
