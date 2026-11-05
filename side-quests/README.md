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
Static deploy on Vercel with no build command. `vercel.json` sets clean URLs and security headers.
