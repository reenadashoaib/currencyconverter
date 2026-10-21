/*
 * Ad settings for every page. This is the only file you need to edit.
 *
 * 1. Put your AdSense publisher ID in `adsenseClient` (looks like "ca-pub-1234567890123456").
 * 2. Create one display ad unit per slot in AdSense (Ads > By ad unit) and paste each
 *    unit's data-ad-slot number below. Slots left empty show a placeholder (or nothing,
 *    if `showPlaceholders` is false).
 * 3. The floating video and full-screen ads take HTML from another ad network
 *    (AdSense units are not allowed inside custom pop-ups or floating boxes).
 *    See README.md for details.
 */
window.AD_CONFIG = {
  adsenseClient: "",

  // Show striped "ad space" boxes where no ad is configured yet.
  // Set to false before going live so empty slots collapse.
  showPlaceholders: true,

  slots: {
    topBanner: "",      // 728×90 desktop, 320×100 mobile, top of every page
    railLeft: "",       // 160×600, left rail on wide screens
    railRight: "",      // 300×600, right rail on wide screens
    tile1: "",          // 300×250 tiles between sections
    tile2: "",
    tile3: "",
    tile4: "",
    footerBanner: "",   // 728×90 desktop, 320×100 mobile, above the footer
  },

  // Floating video player in the bottom-right corner.
  video: {
    enabled: true,
    delaySeconds: 6,    // wait before showing it
    html: "",           // paste your video network's player/ad tag here
  },

  // Full-screen ad shown when a visitor moves to another page on the site,
  // at most once per `frequencyMinutes`. Visitors can close it at once.
  interstitial: {
    enabled: true,
    frequencyMinutes: 30,
    html: "",           // paste your network's interstitial creative/tag here
  },
};
