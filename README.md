# CyberTech-Family

Professional static website for **CyberTech-Family** — offensive testing, IP Tracking and Tracing, incident response, recovery support, and complaint registration with admin intake.

## Brand

- Name: **CyberTech-Family** / display **CYBERTECH-FAMILY**
- Logo: `logo.svg`
- Preview lockup: `logo-cybertech-family.jpg`

## Pages

- `index.html` — home (intro splash + swipe up)
- `services.html` — service catalog
- `about.html` — approach and outcomes
- `contact.html` — briefing request form
- `complaints.html` — complaint registration + crypto payment
- `admin.html` — intake dashboard (verify / admit)
- `ctf loading.html` — standalone splash animation reference

## Local development (site + API)

```bash
cd "C:\tyle\Cyber Deck"
npm install
npm run dev
```

Open:

- Site: http://127.0.0.1:8787/
- Admin: http://127.0.0.1:8787/admin.html
- Health: http://127.0.0.1:8787/api/health

Default admin key: `CTF-Admin-2026`  
Copy `.env.example` → `.env` to change `ADMIN_KEY` or add Neon.

### Storage modes

| Mode | When | Where data lives |
|------|------|------------------|
| **file** | No `DATABASE_URL` | `data/registrations.json` (local) |
| **neon** | `DATABASE_URL` set | Neon Postgres `registrations` table |

```bash
# optional: create file store or apply Neon schema
npm run db:init
```

## Production (Vercel)

1. Push this repo to GitHub (already linked if using existing remote).
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo.
3. Framework preset: **Other** (static HTML + `/api` serverless).
4. Root directory: project root (where `vercel.json` and `index.html` live).
5. Set environment variables:
   - `ADMIN_KEY` — strong secret for admin login + API
   - `DATABASE_URL` — Neon pooled connection string (recommended for production)
6. Deploy.
7. Open `https://your-project.vercel.app/` and `https://your-project.vercel.app/admin.html`

### CLI deploy (optional)

```bash
npx vercel
npx vercel --prod
npx vercel env add ADMIN_KEY
npx vercel env add DATABASE_URL
```

### Neon setup (recommended)

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string.
3. Set `DATABASE_URL` in Vercel Project Settings → Environment Variables (and local `.env`).
4. Run `npm run db:init` once with that env, or let the API auto-create the table on first request.

Without Neon, serverless file storage is ephemeral — **use Neon for real production data**.

## Splash intro

Home page only. Stays until **hold & swipe up** (or Arrow Up / Enter).

## Complaint → Admin flow

1. Client submits complaint on `complaints.html` → `POST /api/registrations`
2. Client pays crypto + confirms → status `payment_submitted` + Complaint ID
3. Admin signs in → lists cases from API
4. Admin **Verify payment** / **Admit** / **Reject** / **Delete**

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/registrations?health=1` | none | Health + storage mode |
| POST | `/api/registrations` | none | Create/update registration |
| GET | `/api/registrations` | `X-Admin-Key` | List registrations |
| PATCH | `/api/registrations` | `X-Admin-Key` | Update status/notes |
| DELETE | `/api/registrations` | `X-Admin-Key` | Delete registration |

Vercel serves `api/registrations.js` as a serverless function at `/api/registrations`.  
Local `npm run dev` mirrors the same routes via Express.

## Security notes

- Admin key is a shared secret (use a strong `ADMIN_KEY` in Vercel production).
- Never commit `.env`.
