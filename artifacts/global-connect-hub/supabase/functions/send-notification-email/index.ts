import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Line = { label: string; value: string };

type Payload = {
  event: string;
  subject?: string;
  title?: string;
  lines?: Line[];
  dedupeKey?: string;
};

const DEFAULTS = {
  from_email: "info@noblespaces.rw",
  from_name: "Noble Spaces",
  recipients: "info@noblespaces.rw",
  events: {
    order: true,
    booking: true,
    quote: true,
    message: true,
    low_stock: true,
  } as Record<string, boolean>,
};

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const renderHtml = (title: string, lines: Line[]) => `<!doctype html>
<html><body style="margin:0;background:#f6f6f4;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e4dc;">
      <div style="background:#0f1512;padding:20px 24px;">
        <span style="color:#c9a227;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Noble Spaces</span>
        <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;">${esc(title)}</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${lines
          .map(
            (l) => `<tr>
              <td style="padding:12px 24px;border-bottom:1px solid #f0ede7;color:#7b756a;font-size:12px;text-transform:uppercase;letter-spacing:1px;width:40%;">${esc(l.label)}</td>
              <td style="padding:12px 24px;border-bottom:1px solid #f0ede7;color:#1c1c1c;font-size:14px;">${esc(l.value)}</td>
            </tr>`,
          )
          .join("")}
      </table>
      <div style="padding:20px 24px;color:#7b756a;font-size:12px;">
        Sent automatically by your Noble Spaces website.
      </div>
    </div>
  </div>
</body></html>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = (await req.json()) as Payload;
    if (!body?.event || typeof body.event !== "string") {
      return json({ error: "event is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: settingRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "email_notifications")
      .maybeSingle();

    const cfg = { ...DEFAULTS, ...((settingRow?.value ?? {}) as Record<string, unknown>) } as
      typeof DEFAULTS;
    const events = { ...DEFAULTS.events, ...(cfg.events ?? {}) };

    if (events[body.event] === false) {
      return json({ skipped: "event disabled" });
    }

    const recipients = String(cfg.recipients || DEFAULTS.recipients)
      .split(/[,;\s]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (recipients.length === 0) return json({ skipped: "no recipients" });

    const title = body.title ?? body.subject ?? "New activity on your website";
    const subject = body.subject ?? title;
    const lines = Array.isArray(body.lines) ? body.lines.slice(0, 40) : [];
    const dedupeKey = body.dedupeKey ?? `${body.event}-${crypto.randomUUID()}`;

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      await supabase.from("email_log").insert({
        dedupe_key: dedupeKey,
        event: body.event,
        recipient: recipients.join(", "),
        subject,
        status: "failed",
        error_message: "RESEND_API_KEY is not configured",
      });
      return json({ error: "RESEND_API_KEY is not configured" }, 500);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${cfg.from_name} <${cfg.from_email}>`,
        to: recipients,
        subject,
        html: renderHtml(title, lines),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`Resend failed [${res.status}]: ${text}`);
      await supabase.from("email_log").insert({
        dedupe_key: dedupeKey,
        event: body.event,
        recipient: recipients.join(", "),
        subject,
        status: "failed",
        error_message: `[${res.status}] ${text}`.slice(0, 800),
      });
      return json({ error: "Email provider request failed", status: res.status, details: text }, res.status);
    }

    let providerId: string | null = null;
    try {
      providerId = (JSON.parse(text) as { id?: string }).id ?? null;
    } catch {
      providerId = null;
    }

    await supabase.from("email_log").insert({
      dedupe_key: dedupeKey,
      event: body.event,
      recipient: recipients.join(", "),
      subject,
      status: "sent",
      provider_id: providerId,
    });

    return json({ ok: true, id: providerId });
  } catch (e) {
    console.error("send-notification-email error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
