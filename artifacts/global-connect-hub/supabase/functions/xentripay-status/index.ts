// Polls XentriPay for the status of a collection (by refid) and updates the
// payment row in the external Supabase database.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const XENTRIPAY_BASE = "https://xentripay.com/api";
const FUNCTION_VERSION = "xentripay-status-v2-2026-05-07";

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
    const { payment_id, transaction_id } = body ?? {};
    if (body?.diagnostic === true) {
      return json({ ok: true, version: FUNCTION_VERSION, endpoint: `${XENTRIPAY_BASE}/collections/status/{refid}` });
    }
    if (!payment_id && !transaction_id) {
      return json({ error: "payment_id or transaction_id required" }, 400);
    }

    const supabase = createClient(extUrl, extKey);

    let refid = transaction_id as string | null;
    if (payment_id && !refid) {
      const { data } = await supabase
        .from("payments")
        .select("transaction_id")
        .eq("id", payment_id)
        .maybeSingle();
      refid = data?.transaction_id || null;
    }
    if (!refid) return json({ error: "No refid available" }, 400);

    const xpRes = await fetch(`${XENTRIPAY_BASE}/collections/status/${encodeURIComponent(refid)}`, {
      headers: { "X-XENTRIPAY-KEY": apiKey },
    });
    const xpText = await xpRes.text();
    let xpJson: any = null;
    try { xpJson = JSON.parse(xpText); } catch { /* */ }

    const raw = String(xpJson?.status || xpJson?.data?.status || "").toUpperCase();
    const status =
      ["SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID"].includes(raw) ? "completed"
      : ["FAILED", "DECLINED", "CANCELLED", "CANCELED", "ERROR", "EXPIRED"].includes(raw) ? "failed"
      : "pending";

    if (payment_id) {
      await supabase.from("payments")
        .update({ payment_status: status, transaction_id: refid })
        .eq("id", payment_id);
    }

    return json({ status, transaction_id: refid, provider: xpJson ?? xpText });
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
