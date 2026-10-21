/* Exchange-rate loading, caching and formatting shared by every page. */
(function () {
  "use strict";

  var CACHE_KEY = "rn-rates-v1";
  var CACHE_TTL_MS = 60 * 60 * 1000; // rates refresh daily upstream; check hourly

  var POPULAR = ["USD", "EUR", "GBP", "JPY", "CNY", "INR", "AUD", "CAD", "CHF", "AED", "SAR", "PKR", "MXN", "BRL", "SGD", "HKD", "TRY", "ZAR"];
  var MAJORS = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR"];

  // Primary source covers ~160 currencies; the fallback covers ~30 (ECB data).
  var SOURCES = [
    {
      name: "ExchangeRate-API",
      url: "https://www.exchangerate-api.com",
      endpoint: "https://open.er-api.com/v6/latest/USD",
      parse: function (data) {
        if (data.result !== "success" || !data.rates) throw new Error("Bad response");
        return { rates: data.rates, updated: data.time_last_update_unix * 1000 };
      },
    },
    {
      name: "Frankfurter (European Central Bank)",
      url: "https://frankfurter.dev",
      endpoint: "https://api.frankfurter.dev/v1/latest?base=USD",
      parse: function (data) {
        if (!data.rates) throw new Error("Bad response");
        var rates = Object.assign({ USD: 1 }, data.rates);
        return { rates: rates, updated: Date.parse(data.date + "T16:00:00Z") };
      },
    },
  ];

  function readCache() {
    try {
      var raw = window.localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(value) {
    try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }

  async function fetchFrom(source) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var res = await fetch(source.endpoint, { signal: controller.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var parsed = source.parse(await res.json());
      return {
        rates: parsed.rates,
        updated: parsed.updated,
        fetchedAt: Date.now(),
        source: { name: source.name, url: source.url },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  // Resolves to { rates (USD based), updated, source, stale }.
  async function load() {
    var cached = readCache();
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return Object.assign({ stale: false }, cached);
    for (var i = 0; i < SOURCES.length; i++) {
      try {
        var fresh = await fetchFrom(SOURCES[i]);
        writeCache(fresh);
        return Object.assign({ stale: false }, fresh);
      } catch (e) { /* try the next source */ }
    }
    if (cached) return Object.assign({ stale: true }, cached);
    throw new Error("No exchange-rate source could be reached");
  }

  function convert(amount, from, to, rates) {
    return amount * (rates[to] / rates[from]);
  }

  var displayNames = null;
  try { displayNames = new Intl.DisplayNames(["en"], { type: "currency" }); } catch (e) { /* older browsers */ }

  function name(code) {
    var n = displayNames && displayNames.of(code);
    return n && n !== code ? n : code;
  }

  // Two decimals for everyday amounts, more significant digits for tiny ones.
  function formatNumber(value) {
    var abs = Math.abs(value);
    var opts = abs !== 0 && abs < 1
      ? { maximumSignificantDigits: 4 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return new Intl.NumberFormat("en-US", opts).format(value);
  }

  function formatRate(value) {
    var abs = Math.abs(value);
    var opts = abs >= 100 ? { maximumFractionDigits: 2 } : abs >= 1 ? { maximumFractionDigits: 4 } : { maximumSignificantDigits: 4 };
    return new Intl.NumberFormat("en-US", opts).format(value);
  }

  function formatUpdated(ms) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short",
    }).format(new Date(ms));
  }

  // Popular currencies first, then every other one by name.
  function fillSelect(select, codes, selected) {
    var popular = document.createElement("optgroup");
    popular.label = "Popular";
    var all = document.createElement("optgroup");
    all.label = "All currencies";
    POPULAR.filter(function (c) { return codes.indexOf(c) !== -1; }).forEach(function (c) {
      popular.appendChild(new Option(name(c) + " (" + c + ")", c));
    });
    codes.slice().sort(function (a, b) { return name(a).localeCompare(name(b)); }).forEach(function (c) {
      all.appendChild(new Option(name(c) + " (" + c + ")", c));
    });
    select.replaceChildren(popular, all);
    select.value = selected;
  }

  window.RateNote = {
    load: load,
    convert: convert,
    name: name,
    formatNumber: formatNumber,
    formatRate: formatRate,
    formatUpdated: formatUpdated,
    fillSelect: fillSelect,
    MAJORS: MAJORS,
  };
})();
