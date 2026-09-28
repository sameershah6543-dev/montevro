# Montevro — Store & Business Dashboard

Next.js 16 · PostgreSQL (Prisma 7) · Tailwind CSS 4 · Recharts

- **Store** (`/`): home, shop with search & filters, product pages with sizes, bag, checkout (COD / bank transfer), coupons, wishlist, customer accounts, order tracking (`/track`), printable receipts, WhatsApp chat.
- **Admin** (`/admin`): sales dashboard (Today / Week / Month / Year / Custom), orders & status tracking, invoices, products & images, size-level inventory with stock history and low-stock alerts, expenses, monthly P&L, CSV/Excel exports, coupons, customers, messages, notification settings.
- **Automation**: every new order sends a WhatsApp message to the owner (+ optional emails), logged in Admin → Settings.

---

## Run it on your computer

```bash
npm install
npm run db:local          # terminal 1 — starts a local PostgreSQL (keep it running)
npx prisma migrate deploy # terminal 2 — creates the tables
npm run db:seed -- --demo # products + admin user + DEMO orders/expenses (local only)
npm run dev               # open http://localhost:3000  (admin: http://localhost:3000/admin)
```

Admin login comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.

---

## Go live on www.montevro.com

Montevro is currently a Google Site. The new site needs a host that runs Node.js plus a database. The steps below use **Vercel** (hosting) and **Neon** (PostgreSQL). Both have free tiers that are plenty for a growing store. You keep the domain at Namecheap; you only change its DNS records.

### 1. Database — Neon
1. Sign up at <https://neon.tech> → **Create project** (region: *AWS Asia Pacific (Singapore)* is closest to Pakistan).
2. Copy the **connection string** (`postgresql://…?sslmode=require`). This is your `DATABASE_URL`.

### 2. Code — GitHub
Push this folder to a **private** GitHub repository.

### 3. Hosting — Vercel
1. Sign up at <https://vercel.com> with GitHub → **Add New → Project** → import the repo.
2. Under **Environment Variables**, add everything from `.env.example`:
   - `DATABASE_URL` (from Neon)
   - `AUTH_SECRET`: a long random string (e.g. from <https://generate-secret.vercel.app/64>)
   - `NEXT_PUBLIC_SITE_URL` = `https://www.montevro.com`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`: your admin login (use a strong password)
   - WhatsApp settings (see step 5)
3. **Storage → Create → Blob** and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`, which product and receipt image uploads need.
4. Click **Deploy**.
5. Create the tables and load the catalogue **once**, from your computer, with the Neon URL:
   ```bash
   DATABASE_URL="<neon url>" ADMIN_EMAIL="…" ADMIN_PASSWORD="…" npx prisma migrate deploy
   DATABASE_URL="<neon url>" ADMIN_EMAIL="…" ADMIN_PASSWORD="…" npm run db:seed
   ```
   ⚠️ Never pass `--demo` against the live database.

### 4. Domain — Namecheap
1. In Vercel: **Project → Settings → Domains** → add `montevro.com` and `www.montevro.com` (set `www` as primary).
2. In Namecheap: **Domain List → montevro.com → Manage → Advanced DNS**:
   - Delete the existing Google Sites records (the `CNAME www → ghs.googlehosted.com` and any `A`/URL-redirect records on `@`).
   - Add **A Record** · Host `@` · Value `76.76.21.21`
   - Add **CNAME Record** · Host `www` · Value `cname.vercel-dns.com`
   - (Use the exact values Vercel shows on the Domains page if they differ.)
3. Wait 5–60 minutes. Vercel issues the HTTPS certificate automatically.
4. In Google Sites, unpublish the old site or remove its custom URL.

### 5. WhatsApp order alerts
**Option A: CallMeBot (free, 2-minute setup, recommended to start)**
1. Save **+34 644 78 13 70** in the phone that has WhatsApp for +92 334 9024848.
2. Send it this exact message: `I allow callmebot to send me messages`
3. You'll receive an API key. In Vercel, set:
   `WHATSAPP_PROVIDER=callmebot`, `WHATSAPP_ADMIN_NUMBER=923349024848`, `CALLMEBOT_API_KEY=<key>`
4. Redeploy, then open **Admin → Settings → Send test WhatsApp**.

**Option B: Meta WhatsApp Cloud API** (official, needs a Meta Business account):
set `WHATSAPP_PROVIDER=meta`, `META_WA_TOKEN`, `META_WA_PHONE_NUMBER_ID`.

**Email alerts (optional):** create a free <https://resend.com> account, verify `montevro.com`, and set `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`. Customers then also get order confirmation and shipping emails.

---

## How the numbers are calculated
- **Revenue**: order totals (incl. shipping charged) for orders that aren't Cancelled/Returned, by order date.
- **COGS**: each item's *cost price at the time of sale* × quantity. Set cost prices per product in Admin → Products.
- **Gross profit** = Revenue − COGS · **Net profit** = Gross profit − Expenses.
- **Pairs sold**: total quantity across counted orders.
- Growth % compares against the previous period of the same length (previous month / year for those presets).
- All dates use Pakistan time (Asia/Karachi).

## Architecture notes (for future integrations)
| Concern | Where |
|---|---|
| Order creation, stock deduction, status changes | `src/lib/orders.ts`, `src/lib/inventory.ts` |
| Notifications (WhatsApp / email providers) | `src/lib/notify/` |
| Analytics / P&L | `src/lib/analytics.ts` |
| File uploads (Vercel Blob / local) | `src/lib/storage.ts` |
| Auth (JWT cookie, bcrypt, role checks) | `src/lib/auth.ts`, `src/proxy.ts` |
| Payment gateway (JazzCash, Easypaisa, Stripe) | add `PaymentMethod.CARD` handling in checkout; the schema already reserves it |
| Courier APIs (TCS, Leopards, PostEx, Trax) | `Order.courier` + `Order.trackingNumber` exist; add a provider that books shipments on status → SHIPPED |
