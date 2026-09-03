import { useState } from "react";
import { Copy, Check, Smartphone, Landmark, MessageCircle, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { notifyAdminEmail } from "@/lib/notify";


export type BookingPayload = {
  serviceSlug: string;
  serviceTitle: string;
  bookingDate: string;   // yyyy-mm-dd
  timeSlot: string;
  name: string;
  phone: string;
  email?: string;
  description?: string;
  amountLabel?: string;  // e.g. "RWF 50,000"
};

const WHATSAPP_NUMBER = "250793521437";
const MOMO_CODE = "0793521437";
const BANK_ACCOUNT = "4002201390383";
const HOLDER = "NOBLE SPACES Ltd";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  booking: BookingPayload;
  onDone?: () => void;
};

const CopyRow = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-secondary/40 p-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
        <div className="mt-1 truncate font-mono text-base text-gold">{value}</div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
};

const buildMessage = (b: BookingPayload, method: string) =>
  [
    `*Noble Spaces — New booking*`,
    ``,
    `*Service:* ${b.serviceTitle}`,
    `*Date:* ${b.bookingDate}`,
    `*Time:* ${b.timeSlot}`,
    `*Name:* ${b.name}`,
    `*Phone:* ${b.phone}`,
    b.email ? `*Email:* ${b.email}` : "",
    b.amountLabel ? `*Amount:* ${b.amountLabel}` : "",
    `*Payment method:* ${method}`,
    b.description ? `\n*Details:*\n${b.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

export const PayOptionsDialog = ({ open, onOpenChange, booking, onDone }: Props) => {
  const [saving, setSaving] = useState<string | null>(null);

  const persist = async (method: string) => {
    setSaving(method);
    const { error } = await supabase.from("bookings").insert({
      service_name: booking.serviceTitle,
      booking_date: booking.bookingDate,
      time_slot: booking.timeSlot,
      status: "pending",
      customer_name: booking.name,
      phone: booking.phone,
      email: booking.email ?? null,
      description: booking.description ?? null,
      payment_method: method,
    });
    setSaving(null);
    if (error) {
      toast({ title: "Could not save booking", description: error.message, variant: "destructive" });
      return false;
    }
    void notifyAdminEmail({
      event: "booking",
      subject: `New booking (${method}) — ${booking.serviceTitle}`,
      title: "New booking",
      lines: [
        { label: "Service", value: booking.serviceTitle },
        { label: "Date", value: booking.bookingDate },
        { label: "Time", value: booking.timeSlot },
        { label: "Name", value: booking.name },
        { label: "Phone", value: booking.phone },
        { label: "Email", value: booking.email ?? "" },
        { label: "Payment", value: method },
        { label: "Details", value: booking.description ?? "" },
      ],
    });
    return true;
  };


  const confirmPayment = async (method: "Mobile Money" | "Bank transfer") => {
    const ok = await persist(method);
    if (!ok) return;
    toast({
      title: "Booking received",
      description:
        "We've noted your booking. Complete the transfer and our team will confirm shortly.",
    });
    onOpenChange(false);
    onDone?.();
  };

  const sendQuotation = async () => {
    const ok = await persist("Quotation (WhatsApp)");
    if (!ok) return;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      buildMessage(booking, "Quotation via WhatsApp"),
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onOpenChange(false);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-gold/30 bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Complete your booking</DialogTitle>
          <DialogDescription>
            Pay upfront with Mobile Money or bank transfer, or send a quotation on WhatsApp to
            negotiate.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="momo" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="momo">
              <Smartphone className="mr-1.5 h-3.5 w-3.5" /> MoMo Pay
            </TabsTrigger>
            <TabsTrigger value="bank">
              <Landmark className="mr-1.5 h-3.5 w-3.5" /> Bank
            </TabsTrigger>
            <TabsTrigger value="quote">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Quote
            </TabsTrigger>
          </TabsList>

          <TabsContent value="momo" className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">
              Dial <span className="text-gold">*182*1*1#</span> on your phone, choose <em>Pay</em>,
              enter the MoMo Pay number below and the amount, then confirm with your PIN.
            </p>
            <CopyRow label="MoMo Pay Number" value={MOMO_CODE} />
            <CopyRow label="Account name" value={HOLDER} />
            {booking.amountLabel && <CopyRow label="Amount to pay" value={booking.amountLabel} />}
            <Button
              className="w-full bg-gold text-primary-foreground hover:bg-gold/90"
              disabled={saving !== null}
              onClick={() => confirmPayment("Mobile Money")}
            >
              {saving === "Mobile Money" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              I've paid with MoMo
            </Button>
          </TabsContent>

          <TabsContent value="bank" className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">
              Transfer the amount to the account below from your bank app or branch.
              (EQUITY BANK)
            </p>
            <CopyRow label="Bank account number" value={BANK_ACCOUNT} />
            <CopyRow label="Account name" value={HOLDER} />
            {booking.amountLabel && <CopyRow label="Amount to transfer" value={booking.amountLabel} />}
            <Button
              className="w-full bg-gold text-primary-foreground hover:bg-gold/90"
              disabled={saving !== null}
              onClick={() => confirmPayment("Bank transfer")}
            >
              {saving === "Bank transfer" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              I've made the transfer
            </Button>
          </TabsContent>

          <TabsContent value="quote" className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">
              Not ready to pay yet? Send a quotation request on WhatsApp and our team will discuss
              scope and pricing with you directly.
            </p>
            <div className="rounded-lg border border-gold/20 bg-secondary/40 p-3 text-sm">
              We'll send a pre-filled message with your booking details so you don't have to retype
              anything.
            </div>
            <Button
              className="w-full bg-gold text-primary-foreground hover:bg-gold/90"
              disabled={saving !== null}
              onClick={sendQuotation}
            >
              {saving === "Quotation (WhatsApp)" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="mr-2 h-4 w-4" />
              )}
              Open WhatsApp
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
