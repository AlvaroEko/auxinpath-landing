# AuxinPath Landing Page - Changelog

## February 17, 2026

### Security Hardening

- **Cloudflare Turnstile** (invisible mode) — bot protection on the waitlist form. Validates in background without visible UI. Site key configured for `auxinpath.com`.
- **Rate limiting** — 30-second cooldown between form submissions. Prevents rapid spam.
- **Duplicate submission prevention** — after a successful signup, the form blocks re-submission and shows "You have already joined the waitlist."
- **Email obfuscation** — `hello@auxinpath.com` removed from HTML and JSON-LD. Constructed via JavaScript on click to prevent email harvesting bots.
- **CSP updated** — `script-src` and `frame-src` now allow `https://challenges.cloudflare.com` for Turnstile.
- **Honeypot field** (`_gotcha`) — already present, catches simple bots that auto-fill all fields.

### New Sections & Pages

- **"How it Works" section** — 3-step visual guide between Features and FAQ: (1) Join the Waitlist, (2) Get Early Access, (3) Run Your Clinic. Responsive layout with arrow connectors, numbered circles, and SVG icons. Added to sticky nav and footer links.
- **Custom 404 page** (`404.html`) — branded error page with AuxinPath logo, teal accent, and "Back to Home" button. Cloudflare Pages serves this automatically for missing routes.

### Performance

- **Minified CSS** — `styles.min.css` (33KB to 24KB, -28%). Source `styles.css` kept for development.
- **Minified JS** — `main.min.js` (20KB to 9KB, -57%). Source `main.js` kept for development.
- **Preconnect hints** — `<link rel="preconnect">` for `challenges.cloudflare.com` and `script.google.com` to reduce DNS/TLS latency.
- **Preload logo SVG** — `<link rel="preload" href="assets/logo.svg">` for faster Largest Contentful Paint.

### PWA & Social

- **manifest.json** — PWA-lite manifest with app name, theme color (#0D7377), background color, and icons (SVG + 180px PNG). Users can "Add to Home Screen" on mobile.
- **OG image** (`og-image.png`) — generated from the official AuxinPath logo PNG. Used for link previews on LinkedIn, Twitter, WhatsApp, Slack, etc.
- **Apple Touch Icon** (`apple-touch-icon.png`) — 180x180 PNG for iOS home screen bookmarks.

### UX

- **Form scroll-reveal animation** — waitlist form now fades in when scrolled into view (scroll-reveal class).

### Misc

- Deleted Windows `nul` artifact file from repo.
- Tool scripts in `tools/` for regenerating images (`generate-og.mjs`, `generate-images.mjs`, `generate-apple-touch-icon.html`, `generate-og-image.html`).

---

### Re-minification Reminder

After editing `css/styles.css` or `js/main.js`, re-minify before pushing:

```bash
npx terser js/main.js --compress --mangle -o js/main.min.js
npx clean-css-cli css/styles.css -o css/styles.min.css
```

### Turnstile Setup

- **Site key**: configured in `index.html` on the `cf-turnstile` div
- **Mode**: invisible (validates in background)
- **Dashboard**: Cloudflare > Turnstile > auxinpath.com
