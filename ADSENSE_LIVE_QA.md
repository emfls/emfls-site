# emfls.com AdSense Live QA

## Deployment

- Git repository: `https://github.com/emfls/emfls-site.git`
- Commit: `4abad48` (`feat: prepare emfls.com for adsense review`)
- Production branch: `main` (tracked by `origin/main`)
- Push: PASS
- Cloudflare deployment: live content reflects commit-specific Phase 2C changes; dashboard deployment record not accessed
- Live version verified: homepage and 11 representative article titles reflect the pushed content

## Host & TLS

- HTTPS apex: PASS, `https://emfls.com/` returns 200
- HTTP → HTTPS: PASS, `http://emfls.com/` returns 301 to `https://emfls.com/`
- www: `https://www.emfls.com/` and `http://www.emfls.com/` return 404 from a GitHub edge response; no independent 200 duplicate observed
- certificate: HTTPS connection valid for the tested request; expiry details not separately inspected
- pages.dev: actual project hostname not available from repository or tested live output; `PAGES_DEV_REVIEW_REQUIRED`

## Core Pages

- homepage: 200, current Phase 2C title present
- representative articles: 11/11 return 200; title, canonical, H1, description and indexable state pass
- categories: 5/5 return 200 with H1 and article links
- trust pages: About, Contact, Privacy, Terms, Editorial Policy, Disclaimer return 200

## Representative Articles

| URL | Status | Canonical | Indexable | AdSense Code | Result |
|---|---:|---|---|---|---|
| `/articles/personal-domain-website-start-checklist/` | 200 | self | yes | present | PASS |
| `/articles/gabia-domain-cloudflare-dns/` | 200 | self | yes | present | PASS |
| `/articles/cloudflare-dns-setup-for-beginners/` | 200 | self | yes | present | PASS |
| `/articles/why-astro-for-static-content-site/` | 200 | self | yes | present | PASS |
| `/articles/github-to-cloudflare-pages-deployment/` | 200 | self | yes | present | PASS |
| `/articles/after-first-deploy-checklist/` | 200 | self | yes | present | PASS |
| `/articles/how-to-check-https-on-custom-domain/` | 200 | self | yes | present | PASS |
| `/articles/google-search-console-domain-property-guide/` | 200 | self | yes | present | PASS |
| `/articles/robots-and-sitemap-basics/` | 200 | self | yes | present | PASS |
| `/articles/adsense-review-essential-pages/` | 200 | self | yes | present | PASS |
| `/articles/adsense-review-final-checklist/` | 200 | self | yes | present | PASS |

## Categories

- 5/5 return 200, have H1, descriptions, canonical and article links

## Trust Pages

- About: 200, operating purpose and operator information visible
- Contact: 200, `contact@emfls.com` mailto visible
- Privacy: 200, Cloudflare Pages/GitHub/AdSense/Analytics status matches repository
- Terms: 200
- Editorial Policy: 200
- Disclaimer: 200

## robots.txt

- status: 200
- content type: plain text
- crawler access: generic `User-agent: *` allows `/`
- Googlebot/Mediapartners-Google explicit block: not present
- sitemap: `https://emfls.com/sitemap-index.xml`

## Sitemap

- `https://emfls.com/sitemap-index.xml`: 200, XML
- `https://emfls.com/sitemap-0.xml`: 200, 25 URLs
- representative article inclusion: confirmed
- tags, HTML sitemap, 404, redirect sources: not included

## ads.txt

- repository/build output: present and contains publisher line
- live `https://emfls.com/ads.txt`: 404 — BLOCKER
- live HTTP request: 301 to HTTPS, final HTTPS resource remains 404
- publisher ID: repository value matches live AdSense script value, but file is not publicly accessible

## AdSense Code

- homepage and tested representative articles: `pagead2.googlesyndication.com` present
- placement: head
- duplicate script: not observed on tested pages
- publisher ID: `ca-pub-8830********4754`

## AdSense Crawler Proxy Checks

- `Googlebot`: 200
- `Mediapartners-Google`: 200
- `Google-Display-Ads-Bot`: 200
- result meaning: `NO_OBVIOUS_UA_BLOCK`; this does not reproduce Google IP crawler behavior

## Redirects

- old connect URL: 301 directly to `/articles/github-to-cloudflare-pages-deployment/`
- old Gabia URL: 301 directly to `/articles/gabia-domain-cloudflare-dns/`
- old Contact URL: 301 directly to `/articles/adsense-review-essential-pages/`
- tested redirect chains: none

## 404

- unique missing path: 404
- response page: noindex and home navigation present

## Noindex Pages

- sampled tag archive: 200 with `noindex,follow`
- HTML sitemap: 200 with `noindex,follow`
- sitemap membership: excluded

## Mobile Rendering

- not tested in a browser: `MOBILE_BROWSER_QA_UNAVAILABLE`

## Navigation

- static core navigation and footer links: present
- live click navigation: not performed in a browser

## Live Internal Links

- representative and core URL requests: no broken target observed
- redirect source internal links: none observed

## Live Placeholder Scan

- homepage and representative article responses: no TODO/TBD/placeholder/lorem ipsum detected

## Blocking Issues

1. Live `/ads.txt` returns 404 although `public/ads.txt` exists in commit `4abad48` and build output.

## Non-Blocking Issues

- Cloudflare dashboard deployment record and actual `pages.dev` hostname were not accessible from repository/live output.
- Mobile and desktop browser rendering were not tested in this environment.

## Final Live Readiness

NO_GO — live `ads.txt` is a required public AdSense connection file and currently returns 404. Do not request AdSense review until it is accessible and rechecked.
