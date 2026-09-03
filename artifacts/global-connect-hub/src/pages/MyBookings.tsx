import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Booking = {
  id: string;
  service_name: string;
  booking_date: string;
  time_slot: string;
  status: "pending" | "confirmed" | "cancelled" | string;
  order_id: string | null;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
      statusStyles[status] ?? "bg-muted text-muted-foreground border-border"
    }`}
  >
    {status}
  </span>
);

const MyBookings = () => {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "My Bookings — Noble Spaces";
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast({ title: "Failed to load bookings", description: error.message, variant: "destructive" });
        setBookings((data ?? []) as Booking[]);
        setLoading(false);
      });

    const channel = supabase
      .channel("bookings-mine")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${userId}` },
        (payload) => {
          setBookings((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Booking;
              if (prev.some((b) => b.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Booking;
              const before = prev.find((b) => b.id === row.id);
              if (before && before.status !== row.status && row.status === "confirmed") {
                toast({ title: "Booking confirmed", description: `${row.service_name} on ${row.booking_date}` });
              }
              return prev.map((b) => (b.id === row.id ? row : b));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Booking;
              return prev.filter((b) => b.id !== row.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!ready) {
    return (
      <section className="mx-auto max-w-md px-6 py-40 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </section>
    );
  }

  if (!userId) {
    return (
      <section className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-display text-3xl">Sign in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in on the booking page to view your appointments.</p>
        <Button asChild className="mt-6"><Link to="/book">Go to booking</Link></Button>
      </section>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.booking_date >= today);
  const past = bookings.filter((b) => b.booking_date < today);

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl">My bookings</h1>
        <Button asChild variant="outline">
          <Link to="/book"><CalendarPlus className="mr-2 h-4 w-4" /> New booking</Link>
        </Button>
      </div>

      {loading ? (
        <Loader2 className="mt-10 h-5 w-5 animate-spin text-muted-foreground" />
      ) : bookings.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No bookings yet.</p>
      ) : (
        <>
          <Group title="Upcoming" items={upcoming} />
          <Group title="Past" items={past} />
        </>
      )}
    </section>
  );
};

const Group = ({ title, items }: { title: string; items: Booking[] }) => {
  if (!items.length) return null;
  return (
    <div className="mt-10">
      <h2 className="mb-3 font-display text-2xl">{title}</h2>
      <div className="grid gap-3">
        {items.map((b) => (
          <div key={b.id} className="rounded-xl border border-gold/20 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{b.service_name}</div>
                <div className="text-xs text-muted-foreground">
                  {b.booking_date} · {b.time_slot}
                </div>
              </div>
              <StatusBadge status={b.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookings;
