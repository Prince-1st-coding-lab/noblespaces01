# paypack-webhook-v2

Isolated Supabase Edge Function that receives Paypack payment webhooks and
updates the `public.orders` table. It does **not** touch any other function or
table.

## 1. What it does

1. Accepts `POST` webhook events from Paypack.
2. Verifies the `x-paypack-signature` header using **HMAC-SHA256** with the
   shared secret `PAYPACK_WEBHOOK_SIGN_KEY` (timing-safe compare; accepts both
   hex and base64 formats, with optional `sha256=` prefix).
3. Parses the JSON body, reads `data.reference` (fallback `data.ref`) and the
   transaction status.
4. Updates the matching row in `public.orders` (matched by `session_id`):
   - success-like statuses → `status = 'successful'`
   - failure / cancellation statuses → `status = 'failed'`
   - anything else → acknowledged (`200 OK`) but no DB write.
5. Replies `200 OK` to `OPTIONS`, `HEAD`, and `GET` for Paypack reachability
   checks and browser CORS preflight.

Uses the **Service Role key** server-side to bypass RLS for the `UPDATE`.

## 2. Target table

```
public.orders (
  id          uuid,
  user_id     uuid,
  total_price ...,
  status      text,
  created_at  timestamptz,
  session_id  text   -- equals Paypack `data.reference`
)
```

The function only writes the `status` column. It does **not** reference
`paypack_ref` or `updated_at`.

## 3. Expected incoming payload

```json
{
  "event": "transaction:successful",
  "data": {
    "reference": "YOUR_SESSION_ID_HERE",
    "status": "successful"
  }
}
```

Accepted status values:

| Incoming `data.status` (contains)                                   | Stored in `orders.status` |
|---------------------------------------------------------------------|---------------------------|
| `successful`, `success`, `paid`, `completed`                        | `successful`              |
| `failed`, `rejected`, `cancelled`, `canceled`, `declined`, `expired`| `failed`                  |
| anything else                                                       | (no change, 200 OK)       |

## 4. Required headers

| Header                | Value                                                  |
|-----------------------|--------------------------------------------------------|
| `Content-Type`        | `application/json`                                     |
| `x-paypack-signature` | HMAC-SHA256 of the **raw request body** using `PAYPACK_WEBHOOK_SIGN_KEY`, hex or base64, optional `sha256=` prefix |

Missing or invalid signature → `401 Unauthorized`.

## 5. Required environment variables (Lovable Cloud / Supabase Vault)

| Name                        | Purpose                                                       |
|-----------------------------|---------------------------------------------------------------|
| `PAYPACK_WEBHOOK_SIGN_KEY`  | Shared secret used to verify the HMAC signature. Same value must be configured in the Paypack dashboard. |
| `SUPABASE_URL`              | Auto-injected by Lovable Cloud.                               |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Lovable Cloud. Used to bypass RLS for update.|

Set `PAYPACK_WEBHOOK_SIGN_KEY` in **Project Settings → Functions → Secrets**.

## 6. Endpoint

```
POST https://<project-ref>.functions.supabase.co/paypack-webhook-v2
```

For this project:

```
https://qzfnzphbllhyyiyygaiy.functions.supabase.co/paypack-webhook-v2
```

Paste this URL into your Paypack dashboard → **Webhooks**, and paste the same
`PAYPACK_WEBHOOK_SIGN_KEY` value as the signing key there.

## 7. Manual setup checklist

1. Add `PAYPACK_WEBHOOK_SIGN_KEY` in Lovable → Functions → Secrets.
2. In Paypack dashboard → Webhooks, register the URL above and paste the
   **same** signing key.
3. Make sure the row you want to update in `orders` has `session_id` set to the
   exact `reference` you send to Paypack when initiating a transaction.

## 8. Test with a mock payload

The signature must be computed over the exact raw body bytes that are sent.

### Node.js / Bun

```js
import crypto from "node:crypto";

const url = "https://qzfnzphbllhyyiyygaiy.functions.supabase.co/paypack-webhook-v2";
const secret = process.env.PAYPACK_WEBHOOK_SIGN_KEY;

const body = JSON.stringify({
  event: "transaction:successful",
  data: { reference: "REPLACE_WITH_AN_EXISTING_session_id", status: "successful" },
});

const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-paypack-signature": signature,
  },
  body,
});
console.log(res.status, await res.text());
```

### curl + openssl

```bash
SECRET='your-sign-key'
BODY='{"event":"transaction:successful","data":{"reference":"REPLACE_WITH_session_id","status":"successful"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "x-paypack-signature: $SIG" \
  --data "$BODY" \
  https://qzfnzphbllhyyiyygaiy.functions.supabase.co/paypack-webhook-v2
```

### Expected responses

| Scenario                                     | Status | Body                                        |
|----------------------------------------------|--------|---------------------------------------------|
| Valid signature, success status, row matches | 200    | `{"ok":true,"matched":1,"status":"successful"}` |
| Valid signature, no row matches reference    | 200    | `{"ok":true,"matched":0,"status":"successful"}` |
| Invalid / missing signature                  | 401    | `{"error":"invalid signature"}`             |
| Missing `data.reference`                     | 400    | `{"error":"missing reference"}`             |
| `HEAD` / `GET` (reachability)                | 200    | (empty)                                     |
| `OPTIONS` (CORS preflight)                   | 200    | `ok`                                        |
