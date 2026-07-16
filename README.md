# Cybersecurity Family

Professional static website for Cybersecurity Family — offensive testing, detection engineering, incident response, and recovery support.

## Pages

- `index.html` — home
- `services.html` — service catalog
- `about.html` — approach and outcomes
- `contact.html` — briefing request form

## Local preview

```bash
python -m http.server 5500
```

Open `http://127.0.0.1:5500`.

## Deploy

This is a static site. Deploy the project root to Netlify, Cloudflare Pages, GitHub Pages, or any static host.

Contact form uses Netlify Forms attributes (`data-netlify`). On Netlify, submissions are captured automatically. On other hosts, wire the form to your preferred endpoint.
