# Full storefront, category management, email notifications, homepage rebalance

## 1. Shop: full e-commerce experience

- **Category CRUD in admin** — new "Categories" screen under Catalogue: name, slug, description, image, sort order, active toggle, delete (with guard when products still reference it).
- **Category landing pages** at `/shop/category/:slug` with the category's title, description and product grid.
- **Browse controls on `/shop`** — text search (name + short description), sort (newest, price low→high, price high→low, name), price range, in-stock-only toggle, and the existing category chips. All state reflected in the URL so results can be shared.
- **Product grid polish** — responsive grid, out-of-stock and low-stock badges, discount percentage, quick add-to-cart, empty/loading states.
- **Product page** — image gallery with thumbnails and lightbox, stock status, quantity picker, breadcrumbs, delivery/payment info, related products from the same category.
- **Cart & checkout** — persistent cart drawer with quantity edit and line removal, subtotal/delivery/total breakdown, order confirmation view after checkout. Existing checkout validation and payment options stay as-is.

## 2. Email notifications via Resend

- Connect the Resend account through the connector flow (you'll approve a card in chat).
- One backend function sends branded HTML notification emails for: **new orders**, **new bookings**, **quotation requests**, **contact messages**, and **low-stock alerts**.
- **Admin → Settings → Email**: editable "send from" address/name and "send to" recipient list (defaults `info@noblespaces.rw`), plus per-event on/off switches. Stored in site settings so no code change is needed to update them.
- Every send is recorded in the existing email log so you can see failures.

## 3. Homepage rebalance

- Remove the **Featured products** grid.
- Keep the **Trending** carousel, restyled as a compact "From our shop" strip with a clear "Browse the shop" link.
- Promote the **Services** section: move it above the shop strip, show service count, category-style cards and a strong "Explore all services" call to action, so visitors immediately see that services are the core offering.

## 4. Mobile admin UI

- Sidebar becomes an off-canvas drawer on mobile with a persistent header trigger; content is never squeezed.
- Tables convert to stacked cards below `md`, so orders/bookings/products stay readable without horizontal scrolling.
- All admin dialogs get proper mobile height, scrolling and sticky footers; touch targets enlarged.

## Technical notes

- New table not needed for categories (`product_categories` exists); admin CRUD writes to it and RLS admin-write policies are already in place.
- Email settings stored as a `site_settings` row (`email_notifications`), read by the edge function at send time.
- Notification emails are triggered from a single `send-notification-email` edge function, invoked from the existing insert paths (checkout, booking, quote, contact) and from a database webhook for low stock.
- Search/sort/filter are done client-side over the already-cached product query for the current catalogue size; category filtering stays server-side.
- Admin table→card responsiveness handled by a shared `ResponsiveTable` wrapper in `src/components/admin/AdminUi.tsx` so every admin page gets it consistently.
