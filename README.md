# RateNote currency converter

A static currency converter website (plain HTML, CSS and JavaScript, no build step) with ad spaces ready for Google AdSense. It's built to deploy on Cloudflare.

Everything that gets deployed is in `public/`.

| Page | File |
|---|---|
| Converter (home) | `public/index.html` |
| Exchange rates for every currency | `public/rates.html` |
| About | `public/about.html` |
| Privacy policy | `public/privacy.html` |
| Not found | `public/404.html` |

Exchange rates load in the visitor's browser from [ExchangeRate-API](https://www.exchangerate-api.com) (about 160 currencies, updated daily, no key needed). If that service can't be reached, the site falls back to European Central Bank rates from [Frankfurter](https://frankfurter.dev) for around 30 currencies. The last rates are cached in the browser for an hour. ExchangeRate-API's free tier asks for a link back to them, which the site shows under the result.

## Ad spaces

| Ad space | Size | Where |
|---|---|---|
| `topBanner` | 728×90 (320×100 on phones) | Top of every page |
| `railLeft` | 160×600 | Left side, screens 1280px and wider; stays in view while scrolling |
| `railRight` | 300×600 | Right side, screens 1280px and wider; stays in view while scrolling |
| `tile1` to `tile4` | 300×250 each | Grid between sections (2 tiles on phones) |
| `footerBanner` | 728×90 (320×100 on phones) | Above the footer |
| Video | 16:9, 400px wide (240px on phones) | Floating, bottom right, appears after 6 seconds, closable |
| Full-screen | Up to 820px wide | Shown when a visitor goes to another page on the site, at most once every 30 minutes, closable at once |

Every ad is labelled "Advertisement". Each space has a fixed size so the page doesn't jump when ads load.

### Setting up AdSense

All ad settings live in one file: `public/js/ads-config.js`.

1. Set `adsenseClient` to your publisher ID, for example `"ca-pub-1234567890123456"`.
2. In AdSense, create a display ad unit for each space (Ads > By ad unit > Display ads) and paste its `data-ad-slot` number into `slots`.
3. In `public/ads.txt`, replace `pub-0000000000000000` with your publisher ID, remove the `#` from that line and delete the comment lines.
4. Replace `hello@example.com` in `about.html` and `privacy.html` with your real contact email.
5. Set `showPlaceholders` to `false` before going live, so any unused space collapses instead of showing a striped box.

To get the site approved, AdSense may ask you to add its verification snippet to `<head>`. Add it to all five HTML files.

### The video and full-screen ads need a different ad network

AdSense doesn't allow its ad units inside a pop-up or a floating box that you build yourself. Putting them there can get your account suspended. So these two spaces take HTML from another network:

- **Video:** paste a video network's player or ad tag into `video.html`. Options include Google Ad Manager with the IMA SDK, or an outstream video partner.
- **Full-screen:** paste another network's interstitial tag into `interstitial.html`. Alternatively, if you only want AdSense, turn on **vignette ads** in AdSense Auto ads and set `interstitial.enabled` to `false`. Vignettes are Google's own full-screen ads between page views.

The full-screen ad only appears between pages, and visitors can close it straight away. That's deliberate: the Better Ads Standards, which Chrome enforces, ban full-screen pop-ups when a page first opens and countdown ads that delay closing. A site that breaks them can have all of its ads blocked in Chrome, AdSense included.

### Consent for visitors in Europe

Google requires a certified consent banner for visitors from the EEA, UK and Switzerland. The simplest route is AdSense's own: Privacy & messaging > European regulations message. It needs no code changes.

## Deploying to Cloudflare

**Option A, Git integration (no command line).** In the Cloudflare dashboard, open Workers & Pages, choose Create, and import this GitHub repository. Leave the build command empty. Cloudflare reads `wrangler.jsonc` and serves `public/`. If you use the older Pages flow instead, set the build output directory to `public`.

**Option B, command line.**

```sh
npx wrangler deploy
```

Clean URLs work as-is: `/rates` serves `rates.html` and unknown paths show `404.html`. `public/_headers` sets security headers and cache times.

## Running locally

```sh
npx wrangler dev
```

Or use any static file server pointed at `public/`. Plain file servers may not resolve `/rates` to `rates.html`.

## Design notes

The look is based on banknote security paper: a pale green-grey paper tone, navy "intaglio" ink, a guilloché rosette and microprint borders on the converter. Typefaces are Bricolage Grotesque for headings and the result figure, and Atkinson Hyperlegible for body text, chosen for clear digits. `public/img/rosette.svg` is a generated pattern; replace it freely.

To rename the site, search and replace "RateNote" across `public/`.
