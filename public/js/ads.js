/* Renders every ad slot on the page from window.AD_CONFIG. */
(function () {
  "use strict";

  var config = window.AD_CONFIG || {};
  var slots = config.slots || {};
  var adsenseReady = /^ca-pub-\d{10,20}$/.test(config.adsenseClient || "");

  var CLOSE_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function store(kind) {
    try { return window[kind]; } catch (e) { return null; }
  }

  function readStore(kind, key) {
    var s = store(kind);
    try { return s ? s.getItem(key) : null; } catch (e) { return null; }
  }

  function writeStore(kind, key, value) {
    var s = store(kind);
    try { if (s) s.setItem(key, value); } catch (e) { /* storage blocked */ }
  }

  function loadAdsense() {
    if (document.querySelector("script[data-adsense]")) return;
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + config.adsenseClient;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-adsense", "");
    document.head.appendChild(script);
  }

  // Inserts third-party HTML and makes any <script> tags in it run.
  function injectHTML(target, html) {
    target.innerHTML = html;
    target.querySelectorAll("script").forEach(function (old) {
      var fresh = document.createElement("script");
      Array.prototype.forEach.call(old.attributes, function (attr) {
        fresh.setAttribute(attr.name, attr.value);
      });
      fresh.textContent = old.textContent;
      old.replaceWith(fresh);
    });
  }

  function placeholder(text) {
    var box = document.createElement("div");
    box.className = "ad__placeholder";
    box.textContent = text;
    return box;
  }

  function label() {
    var span = document.createElement("span");
    span.className = "ad__label";
    span.textContent = "Advertisement";
    return span;
  }

  // ---------- In-page display slots ----------
  var usedAdsense = false;

  document.querySelectorAll("[data-ad]").forEach(function (el) {
    var key = el.getAttribute("data-ad");
    var slotId = slots[key];
    var inner = document.createElement("div");
    inner.className = "ad__slot";

    if (adsenseReady && slotId) {
      var ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.setAttribute("data-ad-client", config.adsenseClient);
      ins.setAttribute("data-ad-slot", slotId);
      ins.setAttribute("data-ad-format", el.getAttribute("data-ad-format") || "auto");
      ins.setAttribute("data-full-width-responsive", "false");
      inner.appendChild(ins);
      usedAdsense = true;
    } else if (config.showPlaceholders) {
      var mobileSize = el.getAttribute("data-ad-size-mobile");
      var size = mobileSize && window.matchMedia("(max-width: 767px)").matches ? mobileSize : el.getAttribute("data-ad-size");
      inner.appendChild(placeholder(size + " ad space"));
    } else {
      // Nothing to show: collapse the slot (and its band, if it has one).
      var band = el.closest(".ad-band");
      (band || el).remove();
      return;
    }

    el.setAttribute("role", "complementary");
    el.setAttribute("aria-label", "Advertisement");
    el.append(label(), inner);
  });

  if (usedAdsense) {
    loadAdsense();
    document.querySelectorAll(".adsbygoogle").forEach(function () {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  // Remove the tile row entirely if every tile collapsed.
  document.querySelectorAll(".ad-tiles").forEach(function (row) {
    if (!row.querySelector(".ad")) row.remove();
  });

  // ---------- Floating video, bottom right ----------
  var video = config.video || {};
  if (video.enabled && (video.html || config.showPlaceholders) && readStore("sessionStorage", "rn-video-closed") !== "1") {
    setTimeout(function () {
      var box = document.createElement("aside");
      box.className = "video-ad";
      box.setAttribute("aria-label", "Advertisement");
      box.innerHTML =
        '<div class="video-ad__bar"><span class="ad__label">Advertisement</span>' +
        '<button type="button" class="close-button" aria-label="Close video ad">' + CLOSE_ICON + "</button></div>" +
        '<div class="video-ad__media"></div>';
      var media = box.querySelector(".video-ad__media");
      if (video.html) injectHTML(media, video.html);
      else media.appendChild(placeholder("Video ad space, 16:9"));
      box.querySelector("button").addEventListener("click", function () {
        box.remove();
        writeStore("sessionStorage", "rn-video-closed", "1");
      });
      document.body.appendChild(box);
    }, Math.max(0, Number(video.delaySeconds) || 0) * 1000);
  }

  // ---------- Full-screen interstitial between pages ----------
  var inter = config.interstitial || {};
  if (!inter.enabled || !(inter.html || config.showPlaceholders)) return;

  var frequencyMs = Math.max(1, Number(inter.frequencyMinutes) || 30) * 60 * 1000;

  function dueForInterstitial() {
    var last = Number(readStore("localStorage", "rn-interstitial-at")) || 0;
    return Date.now() - last > frequencyMs;
  }

  function showInterstitial(destination) {
    writeStore("localStorage", "rn-interstitial-at", String(Date.now()));
    var previousFocus = document.activeElement;
    var overlay = document.createElement("div");
    overlay.className = "interstitial";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Advertisement");
    overlay.innerHTML =
      '<div class="interstitial__panel">' +
      '<div class="interstitial__bar"><span class="ad__label">Advertisement</span>' +
      '<button type="button" class="close-button" aria-label="Close ad and continue">' + CLOSE_ICON + "</button></div>" +
      '<div class="interstitial__media"></div>' +
      '<div class="interstitial__actions"><button type="button" class="button" data-continue>Continue to page</button></div>' +
      "</div>";
    var media = overlay.querySelector(".interstitial__media");
    if (inter.html) injectHTML(media, inter.html);
    else media.appendChild(placeholder("Full-screen ad space"));

    function proceed() {
      window.location.href = destination;
    }
    function onKey(e) {
      if (e.key === "Escape") proceed();
      if (e.key === "Tab") {
        // Keep focus inside the dialog.
        var focusables = overlay.querySelectorAll("button, a[href], iframe, [tabindex]:not([tabindex='-1'])");
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    overlay.querySelector(".close-button").addEventListener("click", proceed);
    overlay.querySelector("[data-continue]").addEventListener("click", proceed);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    overlay.querySelector("[data-continue]").focus();

    // If the visitor comes back with the back button, the page may be restored from cache.
    window.addEventListener("pageshow", function () {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    }, { once: true });
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download") || link.hasAttribute("data-no-interstitial")) return;
    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname) return; // same page, e.g. #anchors
    if (!dueForInterstitial()) return;
    e.preventDefault();
    showInterstitial(url.href);
  });
})();
