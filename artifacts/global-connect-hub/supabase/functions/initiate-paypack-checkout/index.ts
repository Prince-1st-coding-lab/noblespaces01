// Paypack Cashin — initiate USSD push
//
// Authenticates with PAYPACK_CLIENT_ID / PAYPACK_CLIENT_SECRET, then POSTs to
// /transactions/cashin to trigger a Mobile Money PIN prompt on the customer's
// phone. Creates a corresponding `orders` row (status=pending) keyed by
// `session_id` so the paypack-webhook function can later mark it successful/failed.
//
// Request body (JSON):
//   { amount, phone, item_name, email?, customer_name?, notes?, service_slug? }
//
// Success response: { ok: true, order_id, session_id, paypack_ref }
// Failure response: { ok: false, error, provider? } with appropriate status code.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYPACK_BASE = "https://payments.paypack.rw/api";

type Body = {
  amount?: number;
  phone?: string;
  item_name?: string;
  email?: string;
  customer_name?: string;
  notes?: string;
  service_slug?: string;
  user_id?: string | null;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Normalize Rwandan MoMo numbers to the format Paypack expects (2507XXXXXXXX).
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("250") && digits.length === 12) return digits;
  if (digits.startsWith("07") && digits.length === 10) return "250" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 9) return "250" + digits;
  if (digits.length === 12 && digits.startsWith("250")) return digits;
  return null;
}

async function getPaypackToken(clientId: string, clientSecret: string): Promise<string> {
  const r = await fetch(`${PAYPACK_BASE}/auth/agents/authorize`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });
  const text = await r.text();
  let body: any = {};
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!r.ok) throw new Error(`Paypack auth failed (${r.status}): ${text}`);
  const token = body?.access ?? body?.access_token ?? body?.token;
  if (!token) throw new Error("Paypack auth: no access token in response");
  return token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const CLIENT_ID = Deno.env.get("PAYPACK_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("PAYPACK_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return json({ ok: false, error: "Paypack credentials are not configured (PAYPACK_CLIENT_ID / PAYPACK_CLIENT_SECRET)." }, 500);
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    const amount = Math.round(Number(body.amount));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
      return json({ ok: false, error: "Invalid amount" }, 400);
    }

    const phone = normalizePhone((body.phone ?? "").toString());
    if (!phone) {
      return json({ ok: false, error: "Invalid phone number. Use a Rwandan MoMo number (e.g. 0788123456)." }, 400);
    }

    const item_name = (body.item_name ?? "").toString().slice(0, 200) || "Service";
    const email = (body.email ?? "").toString().slice(0, 200) || null;
    const customer_name = (body.customer_name ?? "").toString().slice(0, 120) || null;
    const notes = (body.notes ?? "").toString().slice(0, 2000) || null;
    const service_slug = (body.service_slug ?? "").toString().slice(0, 120) || null;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const session_id = crypto.randomUUID();
    const { data: order, error: insertErr } = await supabase
      .from("orders")
      .insert({
        user_id: body.user_id ?? null,
        email,
        customer_name,
        phone,
        notes,
        service_slug,
        item_name,
        amount,
        status: "pending",
        session_id,
      })
      .select()
      .single();

    if (insertErr) {
      return json({ ok: false, error: "Could not create order", detail: insertErr.message }, 500);
    }

    // Authenticate with Paypack
    let token: string;
    try {
      token = await getPaypackToken(CLIENT_ID, CLIENT_SECRET);
    } catch (e) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
      return json({ ok: false, error: "Paypack authentication failed", detail: String((e as Error).message) }, 502);
    }

    // Trigger Cashin (USSD push to the customer's phone)
    const ppRes = await fetch(`${PAYPACK_BASE}/transactions/cashin`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "Idempotency-Key": session_id,
      },
      body: JSON.stringify({ amount, number: phone }),
    });

    const ppText = await ppRes.text();
    let pp: any = {};
    try { pp = JSON.parse(ppText); } catch { pp = { raw: ppText }; }

    if (!ppRes.ok) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
      const msg = pp?.message ?? pp?.error ?? `Paypack rejected the request (${ppRes.status})`;
      return json({ ok: false, error: msg, provider: pp }, 502);
    }

    const paypack_ref: string | undefined = pp?.ref ?? pp?.reference ?? pp?.id;
    await supabase
      .from("orders")
      .update({ paypack_ref: paypack_ref ?? null })
      .eq("id", order.id);

    return json({
      ok: true,
      order_id: order.id,
      session_id,
      paypack_ref: paypack_ref ?? null,
      message: "Please check your phone for the Mobile Money PIN prompt to complete your payment.",
    });
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message ?? e) }, 500);
  }
});
