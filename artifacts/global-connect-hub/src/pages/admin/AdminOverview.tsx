import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowUpRight, CalendarCheck, CheckCircle2, MessageSquare, Package, Quote, Receipt, RefreshCw, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminUi";

type StatProps = { label: string; value: string | number; icon: LucideIcon; hint: string; tone?: "gold" | "clay" };

const Stat = ({ label, value, icon: Icon, hint, tone = "gold" }: StatProps) => (
  <div className="group relative overflow-hidden rounded-2xl border border-gold/15 bg-card p-5 transition-transform hover:-translate-y-0.5">
    <div className={`absolute right-0 top-0 h-20 w-20 rounded-full blur-3xl ${tone === "clay" ? "bg-clay/20" : "bg-gold/10"}`} />
    <div className="relative flex items-start justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/25 text-gold">
        <Icon className="h-4 w-4" />
      </span>
    </div>
    <div className="relative mt-5 font-display text-3xl text-foreground">{value}</div>
    <div className="relative mt-1 text-xs text-muted-foreground">{hint}</div>
  </div>
);

const AdminOverview = () => {
  const stats = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const responses = await Promise.all([
        supabase.from("orders").select("amount,total,status,created_at").limit(1000),
        supabase.from("bookings").select("id,status,created_at").limit(1000),
        supabase.from("quote_requests").select("id,status").limit(1000),
        supabase.from("contact_messages").select("id,status").limit(1000),
        supabase.from("products").select("id,stock,low_stock_threshold").limit(1000),
      ]);
      const failed = responses.find((response) => response.error);
      if (failed?.error) throw failed.error;
      const [orders, bookings, quotes, messages, products] = responses;
      const orderRows = orders.data ?? [];
      const bookingRows = bookings.data ?? [];
      const revenue = orderRows
        .filter((row) => row.status === "completed")
        .reduce((sum, row) => sum + Number(row.total || row.amount || 0), 0);
      return {
        revenue,
        ordersCount: orderRows.length,
        pendingOrders: orderRows.filter((row) => row.status === "pending").length,
        bookings: bookingRows.length,
        pendingBookings: bookingRows.filter((row) => row.status === "pending").length,
        quotes: (quotes.data ?? []).filter((row) => row.status === "new").length,
        messages: (messages.data ?? []).filter((row) => row.status === "new").length,
        lowStock: (products.data ?? []).filter((row) => row.stock <= row.low_stock_threshold).length,
        products: (products.data ?? []).length,
      };
    },
  });

  if (stats.isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" description="A live snapshot of your business." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-3 w-28 bg-secondary" />
              <Skeleton className="mt-6 h-9 w-32 bg-secondary" />
              <Skeleton className="mt-2 h-3 w-20 bg-secondary" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (stats.isError) {
    return (
      <>
        <PageHeader title="Dashboard" description="A live snapshot of your business." />
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">The dashboard could not load</p>
              <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
              <Button onClick={() => stats.refetch()} variant="outline" size="sm" className="mt-4">
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Try again
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const s = stats.data;
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A live snapshot of Noble Spaces — what needs your attention today."
        action={<Button variant="outline" size="sm" onClick={() => stats.refetch()} className="border-gold/25"><RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh</Button>}
      />
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Revenue collected" value={`RWF ${Number(s.revenue).toLocaleString()}`} icon={TrendingUp} hint="Completed orders" />
        <Stat label="Orders" value={s.ordersCount} icon={Receipt} hint={`${s.pendingOrders} waiting for review`} tone="clay" />
        <Stat label="Bookings" value={s.bookings} icon={CalendarCheck} hint={`${s.pendingBookings} awaiting confirmation`} />
        <Stat label="New quotations" value={s.quotes} icon={Quote} hint="Ready for a response" tone="clay" />
        <Stat label="Unread messages" value={s.messages} icon={MessageSquare} hint="From the contact form" />
        <Stat label="Products" value={s.products} icon={Package} hint={`${s.lowStock} low on stock`} tone="clay" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-gold/15 bg-card p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/75">Daily pulse</p>
              <h2 className="mt-2 font-display text-2xl">Keep the room moving</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">A few quick paths to the work most likely to need your attention.</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-gold" />
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {[
              { label: "Review bookings", value: s.pendingBookings, to: "/admin/bookings" },
              { label: "Answer quotes", value: s.quotes, to: "/admin/quotes" },
              { label: "Read messages", value: s.messages, to: "/admin/messages" },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="group rounded-xl border border-border bg-secondary/25 p-4 transition-colors hover:border-gold/35 hover:bg-secondary/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-2xl text-gold">{item.value}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
                </div>
                <span className="mt-3 block text-xs text-muted-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gold/15 bg-gradient-to-br from-card to-secondary/35 p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold/75">Catalogue health</p>
          <h2 className="mt-2 font-display text-2xl">Ready for the next enquiry</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Keep services, prices and stock details current so every customer gets a clear answer.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/admin/services" className="inline-flex items-center rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-gold/90">Manage services</Link>
            <Link to="/admin/products" className="inline-flex items-center rounded-full border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10">Check products</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOverview;