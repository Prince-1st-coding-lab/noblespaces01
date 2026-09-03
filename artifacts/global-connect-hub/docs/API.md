# Noble Spaces — Backend API Contract

The frontend reads two environment variables (see `.env.example`):

| Var | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of your backend, e.g. `https://api.noblespaces.com` |
| `VITE_ADMIN_TOKEN` | Bearer token used by the `/admin` page for write operations |

If `VITE_API_URL` is empty the site falls back to the bundled local services
in `src/data/services.ts` — useful for development. Once you set a URL, the
frontend will fetch services from your API.

> **CORS:** Allow the site origin (e.g. `https://noblespaces.com`) on all
> endpoints below, including `OPTIONS` preflight.

> **Auth:** All write endpoints (`POST`, `PUT`, `DELETE`) require
> `Authorization: Bearer <VITE_ADMIN_TOKEN>`. Reject with `401` otherwise.

---

## Service object

```ts
type Availability = "both" | "custom" | "service";

interface Service {
  slug: string;             // URL-safe, unique. Example: "sofa-manufacturing"
  title: string;            // Display name
  description: string;      // 1–2 sentences
  icon: string;             // lucide-react icon name, e.g. "Sofa", "ChefHat"
  availability: Availability;
  leadTimeMinDays: number;  // integer >= 0
  leadTimeMaxDays: number;  // integer >= leadTimeMinDays
  coverUrl: string;         // absolute https URL
  gallery: string[];        // ordered list of absolute https URLs
  sortOrder: number;        // ascending. lower = earlier
}
```

`availability` meaning:
- `both` — ready stock + custom orders
- `custom` — made-to-order only
- `service` — on-site service (cleaning, installation visits)

---

## Endpoints

### `GET /services`
Public. Returns `Service[]` sorted by `sortOrder` ascending.

### `GET /services/:slug`
Public. Returns `Service` or `404`.

### `POST /services`  *(auth)*
Body: `Service` minus `gallery` (gallery is built via image upload).
Returns the created `Service` with `gallery: []`.

### `PUT /services/:slug`  *(auth)*
Body: partial `Service`. Returns updated `Service`.

### `DELETE /services/:slug`  *(auth)*
Deletes the service and all its images. Returns `204`.

---

### `GET /services/:slug/images`
Public. Returns:
```ts
type ServiceImage = { id: string; url: string; sortOrder: number };
```
Ordered by `sortOrder` ascending.

### `POST /services/:slug/images`  *(auth)*
`multipart/form-data` with field `file` (image, max ~10 MB recommended).
Server should:
1. Store the file (S3, R2, local disk — your choice).
2. Append it to the service gallery (next `sortOrder`).
3. Return the new `ServiceImage`.

### `DELETE /services/:slug/images/:imageId`  *(auth)*
Removes the image from storage and from the service gallery. Returns `204`.

---

## Error format

Non-2xx responses should be JSON:
```json
{ "error": "Human-readable message" }
```

---

## Seeding the database

To migrate the 17 existing services, your backend can `POST /services` for
each entry in [`docs/seed-services.json`](./seed-services.json), then upload
your image files via `POST /services/:slug/images`.

---

## Quick reference implementations

### Express (Node) outline
```ts
app.get("/services", async (req, res) => res.json(await db.services.findMany({ orderBy: { sortOrder: "asc" } })));

app.use(["/services"], (req, res, next) => {
  if (["GET"].includes(req.method)) return next();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) return res.status(401).json({ error: "Unauthorized" });
  next();
});
```

### Postgres schema
```sql
CREATE TABLE services (
  slug              TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  icon              TEXT NOT NULL DEFAULT 'Sparkles',
  availability      TEXT NOT NULL CHECK (availability IN ('both','custom','service')),
  lead_time_min_days INT NOT NULL DEFAULT 0,
  lead_time_max_days INT NOT NULL DEFAULT 0,
  cover_url         TEXT NOT NULL DEFAULT '',
  sort_order        INT  NOT NULL DEFAULT 0
);

CREATE TABLE service_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_slug TEXT NOT NULL REFERENCES services(slug) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0
);
```
