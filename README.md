# CyberTech-Family

Professional static website for **CyberTech-Family** — offensive testing, detection engineering, incident response, and recovery support.

## Brand

- Name: **CyberTech-Family** / display **CYBERTECH-FAMILY**
- Logo: `logo.svg` (metallic blue monogram)
- Preview lockup: `logo-cybertech-family.jpg`

## Pages

- `index.html` — home
- `services.html` — service catalog
- `about.html` — approach and outcomes
- `contact.html` — briefing request form
- `complaints.html` — complaint registration + crypto payment
- `admin.html` — intake dashboard (confirm / admit registrations)
- `ctf loading.html` — standalone splash animation reference

## Splash intro

The **Welcome to CTFamily** splash runs on the **home page only**, on each full page load/reload (same animation as `ctf loading.html`).

## Admin dashboard

Open `/admin.html`. Default access key (change in `admin.js`):

```text
CTF-Admin-2026
```

Registrations are stored in this browser’s `localStorage` under `ctf_complaint_registrations` (static-site limitation). Use the same browser that receives complaint submissions to review them, or export JSON from the admin panel.

## Local preview

```bash
python -m http.server 5500
```

Open `http://127.0.0.1:5500`.

## Deploy

Static site. Deploy the project root to Netlify, Cloudflare Pages, GitHub Pages, or any static host.

Contact form uses Netlify Forms attributes (`data-netlify`). On Netlify, submissions are captured automatically.
