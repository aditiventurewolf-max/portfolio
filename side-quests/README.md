# Side Quests website

A static, no-build site (plain HTML, CSS, JS) for Side Quests, an after-school build program for kids aged 10–14 in Bengaluru, run in partnership with STEAM Varsity.

## Pages
- `index.html` — main page for parents
- `schools.html` — the free enrichment-session offer for schools (served at `/schools`)
- `404.html` — not-found page

## Before sharing widely
Edit `js/config.js` and fill in:
- `bookingUrl` — the Luma link for the Saturday workshop
- `waitlistUrl` — optional waitlist form (Tally / Google Form)
- `whatsapp` — WhatsApp number, country code first, digits only
- `email` — optional public contact email

Buttons pick the best available option automatically and never point to a dead link.

## Still to add
- Real photos and quotes from the first workshop.
- Confirm the exact locality spelling ("Sahakar Nagar") and every FAQ and safety statement before launch.
- Custom domain and a `sitemap.xml` once the domain is chosen.

## Preview locally
```bash
cd side-quests
python3 -m http.server 8080
```

## Deploy
It is a plain static site, so it runs anywhere.

**Vercel:** import the repo, set Root Directory to `side-quests`, Framework Preset "Other", no build command. `vercel.json` sets clean URLs and security headers.

**Railway:** New Project, Deploy from GitHub repo, then in the service settings set Root Directory to `side-quests` and generate a public domain. `railway.json` and `server.js` (a tiny zero-dependency Node server with clean URLs, a 404 page, gzip and the same security headers) are picked up automatically. The server also writes an absolute `og:image` URL from the request host so link previews work on WhatsApp.
