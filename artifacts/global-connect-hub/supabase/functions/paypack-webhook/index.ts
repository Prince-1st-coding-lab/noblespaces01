// Paypack webhook receiver
// - Responds 200 to HEAD probes (Paypack ping)
// - Verifies SHA-256 HMAC signature on POST events using PAYPACK_WEBHOOK_SIGN_KEY
// - Updates the matching `orders` row to completed / failed / cancelled
//
// Deployed with verify_jwt = false (Paypack does not send a JWT).

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Paypack HEAD-pings the URL to confirm reachability
  if (req.method === "HEAD" || req.method === "GET") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const SIGN_KEY = Deno.env.get("PAYPACK_WEBHOOK_SIGN_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!SIGN_KEY) return new Response("not configured", { status: 500, headers: corsHeaders });

  const rawBody = await req.text();
  const signature =
    req.headers.get("x-paypack-signature") ??
    req.headers.get("X-Paypack-Signature") ??
    "";

  const ok = await verifyHmacSha256(SIGN_KEY, rawBody, signature);
  if (!ok) {
    return new Response("invalid signature", { status: 401, headers: corsHeaders });
  }

  let event: any = {};
  try { event = JSON.parse(rawBody); } catch { /* keep empty */ }

  const data = event?.data ?? event;
  const reference: string | undefined = data?.reference ?? data?.ref ?? data?.client_reference;
  const paypack_ref: string | undefined = data?.ref ?? data?.id;
  const ppStatus: string = String(data?.status ?? event?.event ?? "").toLowerCase();

  let status: "completed" | "failed" | "cancelled" | "pending" = "pending";
  if (["successful", "success", "paid", "completed", "transaction:successful"].some((s) => ppStatus.includes(s))) status = "completed";
  else if (["failed", "transaction:failed", "rejected"].some((s) => ppStatus.includes(s))) status = "failed";
  else if (["cancelled", "canceled"].some((s) => ppStatus.includes(s))) status = "cancelled";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Match by session_id (our reference) or paypack_ref
  const query = supabase.from("orders").update({ status, paypack_ref: paypack_ref ?? null });
  const target = reference
    ? query.eq("session_id", reference)
    : paypack_ref
      ? query.eq("paypack_ref", paypack_ref)
      : null;

  if (target) await target;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function verifyHmacSha256(secret: string, payload: string, signature: string): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expectedHex = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  const provided = signature.replace(/^sha256=/i, "").trim();
  return timingSafeEqual(provided, expectedHex) || timingSafeEqual(provided, expectedB64);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
