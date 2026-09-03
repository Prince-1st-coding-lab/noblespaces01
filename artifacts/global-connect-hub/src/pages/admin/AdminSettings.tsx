import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/admin/AdminUi";
import { useSaveSetting, useSetting } from "@/hooks/useSiteSettings";
import { notifyAdminEmail } from "@/lib/notify";

type EmailSettings = {
  from_email: string;
  from_name: string;
  recipients: string;
  events: Record<string, boolean>;
};

const DEFAULTS: EmailSettings = {
  from_email: "info@noblespaces.rw",
  from_name: "Noble Spaces",
  recipients: "info@noblespaces.rw",
  events: { order: true, booking: true, quote: true, message: true, low_stock: true },
};

const EVENT_LABELS: Record<string, string> = {
  order: "New orders",
  booking: "New bookings",
  quote: "Quotation requests",
  message: "Contact messages",
  low_stock: "Low stock alerts",
};

const AdminSettings = () => {
  const { value, isLoading } = useSetting<EmailSettings>("email_notifications", DEFAULTS);
  const save = useSaveSetting();
  const [form, setForm] = useState<EmailSettings>(DEFAULTS);
  const [testing, setTesting] = useState(false);
  const hydrated = useRef(false);

  // Hydrate the form once from the saved settings; never overwrite what the admin is typing.
  useEffect(() => {
    if (isLoading || hydrated.current) return;
    hydrated.current = true;
    setForm({ ...DEFAULTS, ...value, events: { ...DEFAULTS.events, ...value.events } });
  }, [isLoading, value]);

  const submit = async () => {
    try {
      await save.mutateAsync({ key: "email_notifications", value: form as unknown as Record<string, unknown> });
      toast({ title: "Email settings saved" });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const sendTest = async () => {
    setTesting(true);
    await notifyAdminEmail({
      event: "message",
      subject: "Test notification from your website",
      title: "Test notification",
      lines: [
        { label: "Status", value: "Your email notifications are working" },
        { label: "Sent to", value: form.recipients },
      ],
    });
    setTesting(false);
    toast({
      title: "Test email requested",
      description: "Check the inbox. If nothing arrives, confirm the Resend API key and verified domain.",
    });
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Control who receives website notification emails and which events trigger them."
      />

      <div className="max-w-2xl space-y-6">
        <section className="rounded-xl border border-border p-4 md:p-6">
          <h2 className="flex items-center gap-2 font-medium">
            <Mail className="h-4 w-4 text-gold" /> Email notifications
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>From name</Label>
              <Input
                value={form.from_name}
                onChange={(e) => setForm((f) => ({ ...f, from_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>From address</Label>
              <Input
                value={form.from_email}
                onChange={(e) => setForm((f) => ({ ...f, from_email: e.target.value }))}
                placeholder="info@noblespaces.rw"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Send notifications to</Label>
            <Input
              value={form.recipients}
              onChange={(e) => setForm((f) => ({ ...f, recipients: e.target.value }))}
              placeholder="info@noblespaces.rw, sales@noblespaces.rw"
            />
            <p className="mt-1 text-xs text-muted-foreground">Separate multiple addresses with commas.</p>
          </div>

          <div className="mt-6 space-y-3">
            {Object.keys(EVENT_LABELS).map((key) => (
              <label key={key} className="flex items-center justify-between gap-4 text-sm">
                <span>{EVENT_LABELS[key]}</span>
                <Switch
                  checked={form.events[key] !== false}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, events: { ...f.events, [key]: v } }))}
                />
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save settings
            </Button>
            <Button variant="outline" onClick={sendTest} disabled={testing}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send test email
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Sending uses Resend. Add your Resend API key as the backend secret RESEND_API_KEY and verify the
            sending domain there before emails can be delivered.
          </p>
        </section>
      </div>
    </>
  );
};

export default AdminSettings;
