// Paypack webhook receiver (v2)
//
// Isolated, clean handler for Paypack payment webhooks.
// - Verifies HMAC-SHA256 signature from `x-paypack-signature` against PAYPACK_WEBHOOK_SIGN_KEY
// - Updates `public.orders.status` matched by `session_id` (= Paypack `data.reference`)
// - Schema assumed: orders(id, user_id, total_price, status, created_at, session_id)
// - Handles OPTIONS / HEAD / GET reachability checks with 200
//
// Deployed with verify_jwt = false (Paypack does not send a JWT).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paypack-signature",
  "Access-Control-Allow-Methods": "POST, GET, HEAD, OPTIONS",
};

Deno.serve(async (req) => {
  // CORS preflight + Paypack reachability pings
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
  if (req.method === "HEAD" || req.method === "GET") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const SIGN_KEY = Deno.env.get("PAYPACK_WEBHOOK_SIGN_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SIGN_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
    return json({ error: "Function not configured" }, 500);
  }

  // Read raw body (required for HMAC verification — do not JSON.parse first)
  const rawBody = await req.text();

  const signature =
    req.headers.get("x-paypack-signature") ??
    req.headers.get("X-Paypack-Signature") ??
    "";

  const valid = await verifyHmacSha256(SIGN_KEY, rawBody, signature);
  if (!valid) {
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let event: any = {};
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  const data = event?.data ?? {};
  const reference: string | undefined = data?.reference ?? data?.ref;
  const rawStatus: string = String(data?.status ?? event?.event ?? "").toLowerCase();

  if (!reference) {
    return json({ error: "missing reference" }, 400);
  }

  // Map provider status -> our schema status
  let status: "successful" | "failed" | null = null;
  if (["successful", "success", "paid", "completed"].some((s) => rawStatus.includes(s))) {
    status = "successful";
  } else if (
    ["failed", "rejected", "cancelled", "canceled", "declined", "expired"].some((s) =>
      rawStatus.includes(s),
    )
  ) {
    status = "failed";
  }

  if (!status) {
    // Unknown / intermediate status — ack so Paypack doesn't retry forever
    return json({ ok: true, ignored: true, received_status: rawStatus });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { error, data: updated } = await supabase
    .from("orders")
    .update({ status })
    .eq("session_id", reference)
    .select("id, status, session_id");

  if (error) {
    return json({ error: "db update failed", detail: error.message }, 500);
  }

  return json({ ok: true, matched: updated?.length ?? 0, status });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyHmacSha256(
  secret: string,
  payload: string,
  signature: string,
): Promise<boolean> {
  if (!signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const bytes = new Uint8Array(sigBuf);

  const expectedHex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  const expectedB64 = btoa(String.fromCharCode(...bytes));

  const provided = signature.replace(/^sha256=/i, "").trim();
  return timingSafeEqual(provided, expectedHex) || timingSafeEqual(provided, expectedB64);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
