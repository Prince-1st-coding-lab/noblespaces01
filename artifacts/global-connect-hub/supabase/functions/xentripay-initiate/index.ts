// Initiates a XentriPay mobile money collection and records the payment in the
// external Supabase project.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const XENTRIPAY_BASE = "https://xentripay.com/api";
const BUSINESS_EMAIL = "info@noblespaces.rw";
const BUSINESS_NAME = "Noble Spaces";
const FUNCTION_VERSION = "xentripay-collections-v2-2026-05-07";

// Normalize Rwandan phone to local 10-digit (cnumber) and MSISDN (2507XXXXXXXX).
function normalizePhone(input: string) {
  const digits = String(input).replace(/\D/g, "");
  let local = digits;
  if (digits.startsWith("250") && digits.length === 12) local = "0" + digits.slice(3);
  else if (digits.length === 9 && digits.startsWith("7")) local = "0" + digits;
  if (!/^0\d{9}$/.test(local)) {
    throw new Error("Customer number must be exactly 10 digits, e.g. 0787218242");
  }
  const msisdn = local.startsWith("0") ? "250" + local.slice(1) : "250" + local;
  return { cnumber: local, msisdn };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("XENTRIPAY_API_KEY");
    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (!apiKey || !extUrl || !extKey) {
      return json({ error: "Missing server configuration" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const { customer_name, customer_phone, amount, referral_code, service_title } = body ?? {};

    if (body?.diagnostic === "connectivity") {
      const probe = await fetch(`${XENTRIPAY_BASE}/collections/initiate`, { method: "OPTIONS" });
      return json({ ok: true, version: FUNCTION_VERSION, endpoint: `${XENTRIPAY_BASE}/collections/initiate`, reachable: true, provider_status: probe.status });
    }
    if (body?.diagnostic === true) {
      return json({ ok: true, version: FUNCTION_VERSION, endpoint: `${XENTRIPAY_BASE}/collections/initiate` });
    }

    if (!customer_name || !customer_phone || !amount) {
      return json({ error: "customer_name, customer_phone and amount are required" }, 400);
    }
    const numericAmount = Math.floor(Number(amount));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return json({ error: "amount must be a positive whole number" }, 400);
    }

    const supabase = createClient(extUrl, extKey);

    // Server-side referral validation
    let promoterId: string | null = null;
    let validatedCode: string | null = null;
    if (referral_code && String(referral_code).trim()) {
      const { data: promoter } = await supabase
        .from("promoters")
        .select("id, referral_code")
        .eq("referral_code", String(referral_code).trim())
        .maybeSingle();
      if (promoter) {
        promoterId = promoter.id;
        validatedCode = promoter.referral_code;
      }
    }

    let phone;
    try {
      phone = normalizePhone(customer_phone);
    } catch (e) {
      return json({ error: (e as Error).message }, 400);
    }
    const { cnumber, msisdn } = phone;

    // Per XentriPay docs §3.5
    const xpRes = await fetch(`${XENTRIPAY_BASE}/collections/initiate`, {
      method: "POST",
      headers: {
        "X-XENTRIPAY-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: BUSINESS_EMAIL,
        cname: customer_name || BUSINESS_NAME,
        amount: numericAmount,
        cnumber,
        msisdn,
        currency: "RWF",
        pmethod: "momo",
        chargesIncluded: "true",
      }),
    });

    const xpText = await xpRes.text();
    let xpJson: any = null;
    try { xpJson = JSON.parse(xpText); } catch { /* */ }

    const refid = xpJson?.refid || xpJson?.tid || null;
    const providerOk = xpRes.ok && (xpJson?.success === 1 || xpJson?.retcode === 0 || xpJson?.retcode === "0");

    const { data: inserted, error: insertErr } = await supabase
      .from("payments")
      .insert({
        customer_name,
        customer_phone,
        amount: numericAmount,
        referral_code: validatedCode,
        promoter_id: promoterId,
        payment_status: providerOk ? "pending" : "failed",
        transaction_id: refid,
      })
      .select()
      .single();

    if (insertErr) return json({ error: "DB insert failed", details: insertErr.message }, 500);

    return json({ ok: providerOk, payment: inserted, provider: xpJson ?? xpText },
      providerOk ? 200 : 502);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
