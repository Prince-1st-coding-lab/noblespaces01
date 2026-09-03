# Noble Spaces — Setup & Operations Guide

A React + Vite + Tailwind site for Noble Spaces (Rwanda) with an admin dashboard
that lets you set a price per service and accept online payments through
**Paypack Checkout**. The backend runs on **Lovable Cloud** (Supabase under the
hood) with two Edge Functions for the payment flow.

> All chat between you and the agent that built this is preserved in your Lovable
> project history. This README is the operational manual you asked for: every
> manual step is listed below.

---

## 1. What the app does

- Public marketing site with services, gallery, contact, etc.
- **Booking dialog** on every service page: customer fills in name, phone, email,
  date and notes. They can then send it via WhatsApp, Email, or **Pay online
  with Paypack** for an amount you (the admin) set per service.
- **Admin dashboard** at `/admin` where you:
  - Set/edit the **price per service** (RWF).
  - View **every booking/payment** with its live status
    (`pending` / `completed` / `failed` / `cancelled`).
- Paypack notifies the webhook when payment finishes; the order status updates
  automatically.

---

## 2. Tech stack

| Layer       | Tech                                                                 |
|-------------|----------------------------------------------------------------------|
| Frontend    | React 18, Vite 5, TypeScript, Tailwind, shadcn/ui, react-router      |
| Backend     | Lovable Cloud (managed Supabase) — Postgres + Auth + Edge Functions  |
| Payments    | Paypack Checkout (Rwanda)                                            |
| Hosting     | Lovable preview / your custom domain                                 |
| Source      | GitHub (this repo, two-way synced with Lovable)                      |

---

## 3. Database schema (already migrated)

Created in Lovable Cloud automatically — no action needed unless you self-host.

- `public.user_roles` — links an auth user to a role (`admin` / `user`).
- `public.service_prices` — admin-managed price per service slug.
  Columns: `slug` (pk), `label`, `amount` (integer RWF), `active`, timestamps.
- `public.orders` — every Paypack checkout attempt.
  Columns: `id`, `user_id?`, `customer_name`, `email`, `phone`, `service_slug`,
  `item_name`, `amount`, `status`, `paypack_ref`, `session_id`, `notes`,
  timestamps.
- `public.has_role(uuid, app_role)` — security-definer helper used by RLS.

RLS in short:
- `service_prices`: anyone can read; only admins can insert/update/delete.
- `orders`: a user can read their own rows; admins can read all. Inserts and
  updates happen through the edge function (service role only).
- `user_roles`: a user can read their own roles only.

---

## 4. Edge Functions

Located in `supabase/functions/`. Both deploy with `verify_jwt = false`
(Paypack is a public service and the webhook is unauthenticated).

### `initiate-paypack-checkout`
Called from the booking dialog. It:
1. Validates the request.
2. Inserts a `pending` row into `orders`.
3. Calls `POST https://payments.paypack.rw/api/checkout/initiate` with your
   `PAYPACK_APP_ID`, the amount the admin set, and the customer details.
4. Returns `{ payment_link }` — the frontend redirects the browser to it.

### `paypack-webhook`
Receives Paypack notifications. It:
1. Responds **200** to `HEAD`/`GET` probes (Paypack reachability check).
2. On `POST`, verifies the **HMAC-SHA256** signature using
   `PAYPACK_WEBHOOK_SIGN_KEY` against the raw request body.
3. Maps the Paypack status to `completed` / `failed` / `cancelled` and updates
   the matching `orders` row by `session_id` (our reference) or `paypack_ref`.

---

## 5. Required secrets (you set these once)

Set them in **Lovable → Project Settings → Functions → Secrets** (or in your
self-hosted Supabase project as Edge Function secrets). They are read with
`Deno.env.get(...)` — **never hard-coded**.

| Secret name                 | Where to get it                                         |
|----------------------------|----------------------------------------------------------|
| `PAYPACK_APP_ID`           | Paypack dashboard → your application → *Application ID* |
| `PAYPACK_WEBHOOK_SIGN_KEY` | A strong random string **you choose**. Paste the same value into the Paypack webhook configuration so signatures match. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Lovable
Cloud — you don't set them yourself.

If you self-host or use a separate Supabase project, also add to your `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

These are auto-populated in Lovable.

---

## 6. Paypack dashboard configuration

In your Paypack dashboard (https://dashboard.paypack.rw):

1. **Application** → copy the `Application ID` into the `PAYPACK_APP_ID` secret.
2. **Webhooks** → add a new webhook with the URL:

   ```
   https://<your-supabase-ref>.functions.supabase.co/paypack-webhook
   ```

   Your project ref is shown in Lovable Cloud (or in `.env` as
   `VITE_SUPABASE_PROJECT_ID`). For this project the URL is:

   ```
   https://qzfnzphbllhyyiyygaiy.functions.supabase.co/paypack-webhook
   ```

3. Paste **the same** signing key you saved as `PAYPACK_WEBHOOK_SIGN_KEY`.
4. Paypack will send a `HEAD` probe to the URL — the function responds **200**.

---

## 7. Create your admin account (manual, one-time)

The admin panel uses Lovable Cloud Auth and a `user_roles` table.

1. Open the app, go to `/admin`, and click **Sign in**. If you don't have an
   account, create one in **Lovable → Cloud → Auth → Users → Add user**
   (email + password). Email confirmation is on by default; disable it if you
   want or click the confirmation link from your inbox.
2. Copy that user's UUID (Cloud → Auth → Users).
3. In **Cloud → Database → SQL editor**, run:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('<paste-user-uuid>', 'admin');
   ```

4. Reload `/admin`. You should now see the dashboard.

> Security note: roles are stored in a dedicated `user_roles` table (NOT on the
> profile/users table) and checked via the `has_role()` security-definer
> function. This is the recommended pattern and prevents privilege escalation.

---

## 8. Day-to-day usage

### As admin
- `/admin` → **Service prices**: for each service slug, click **Set price** or
  **Edit** to choose a label (e.g. "Booking deposit"), the amount in RWF, and
  whether it's active. Inactive services hide the Pay button on the booking
  dialog (customers can still book via WhatsApp/email).
- `/admin` → **Bookings & payments**: full live list of every checkout attempt,
  most recent first, with status, customer info, service slug and Paypack
  reference.

### As customer
- Visit any service page → click **Book Now** → fill the form.
- If the admin set a price for that service, a green **Pay RWF X with Paypack**
  button appears. Clicking it creates a pending order and redirects to the
  Paypack hosted page.
- After payment Paypack redirects to `/payment-success` or
  `/payment-cancelled`, and the webhook updates the order status in the
  background.

---

## 9. Local development

```bash
# install
bun install   # or: npm install

# run
bun dev       # or: npm run dev
```

For payments to work locally you'll also need to deploy the edge functions and
set the secrets in your Lovable / Supabase project. The site itself runs fine
without them — the Pay button just shows an error.

---

## 10. Things you must do manually (checklist)

- [ ] In Paypack dashboard, copy your **Application ID**.
- [ ] Choose a strong **webhook signing key** and remember it.
- [ ] In Lovable → Functions → Secrets, add:
      `PAYPACK_APP_ID`, `PAYPACK_WEBHOOK_SIGN_KEY`.
- [ ] In Paypack dashboard → Webhooks, register:
      `https://qzfnzphbllhyyiyygaiy.functions.supabase.co/paypack-webhook`
      and paste the **same** signing key.
- [ ] Create your admin user in Lovable Cloud → Auth and insert a row into
      `public.user_roles` with role `admin` (SQL above).
- [ ] Go to `/admin` → **Service prices** and set amounts for the services you
      want to monetize.
- [ ] Test by booking yourself with a small amount and confirm the row in
      **Bookings & payments** flips to `completed`.
- [ ] (Optional) Connect a custom domain in Lovable.

---

## 11. File map (where each piece lives)

```
src/
  components/BookingDialog.tsx     ← the Book Now form + Pay button
  pages/Admin.tsx                  ← admin dashboard
  pages/PaymentSuccess.tsx         ← Paypack success redirect
  pages/PaymentCancelled.tsx       ← Paypack cancel redirect
  integrations/supabase/client.ts  ← Lovable Cloud client (auto-generated)

supabase/
  config.toml
  functions/
    initiate-paypack-checkout/index.ts
    paypack-webhook/index.ts
  migrations/                      ← database schema history
```

---

## 12. Troubleshooting

- **"PAYPACK_APP_ID not configured"** — add the secret in Lovable → Functions.
- **"invalid signature"** in webhook logs — the signing key in Lovable doesn't
  match the one in Paypack. Re-paste both to the same value.
- **Admin page says "Access denied"** — the signed-in user has no `admin` row
  in `user_roles`. Run the SQL in section 7.
- **Pay button missing** — admin hasn't set/activated a price for that service.
- **Order stays `pending`** — Paypack hasn't fired the webhook yet; check the
  webhook URL in the Paypack dashboard and the function logs in Lovable.
