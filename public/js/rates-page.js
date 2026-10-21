/* Exchange rates page: every currency against a chosen base. */
(function () {
  "use strict";

  var RN = window.RateNote;
  var baseSelect = document.getElementById("base");
  var filterInput = document.getElementById("filter");
  var body = document.getElementById("rates-body");
  var status = document.getElementById("rates-status");
  var updatedText = document.getElementById("updated");
  var data = null;

  var params = new URLSearchParams(window.location.search);
  var base = /^[A-Za-z]{3}$/.test(params.get("base") || "") ? params.get("base").toUpperCase() : "USD";

  function render() {
    var query = filterInput.value.trim().toLowerCase();
    var codes = Object.keys(data.rates)
      .filter(function (c) { return c !== base; })
      .filter(function (c) { return !query || c.toLowerCase().indexOf(query) !== -1 || RN.name(c).toLowerCase().indexOf(query) !== -1; })
      .sort(function (a, b) { return RN.name(a).localeCompare(RN.name(b)); });

    var rows = codes.map(function (c) {
      var tr = document.createElement("tr");
      var cur = document.createElement("td");
      var link = document.createElement("a");
      link.href = "/?amount=1&from=" + base + "&to=" + c;
      link.innerHTML = '<span class="cur-code"></span><span class="cur-name"></span>';
      link.firstChild.textContent = c;
      link.lastChild.textContent = RN.name(c);
      cur.appendChild(link);
      var fwd = document.createElement("td");
      fwd.className = "num amount";
      fwd.textContent = RN.formatRate(RN.convert(1, base, c, data.rates));
      var back = document.createElement("td");
      back.className = "num";
      back.textContent = RN.formatRate(RN.convert(1, c, base, data.rates));
      tr.append(cur, fwd, back);
      return tr;
    });
    body.replaceChildren.apply(body, rows);
    document.getElementById("col-forward").textContent = "1 " + base + " buys";
    document.getElementById("col-back").textContent = "Cost of 1 unit in " + base;
    status.textContent = rows.length
      ? rows.length + " currencies against the " + RN.name(base) + "."
      : "No currency matches “" + filterInput.value + "”. Try a code like JPY or a name like yen.";
    history.replaceState(null, "", window.location.pathname + "?base=" + base);
  }

  baseSelect.addEventListener("change", function () { base = baseSelect.value; render(); });
  filterInput.addEventListener("input", render);

  status.textContent = "Loading today's exchange rates…";
  RN.load().then(function (loaded) {
    data = loaded;
    if (!data.rates[base]) base = "USD";
    RN.fillSelect(baseSelect, Object.keys(data.rates), base);
    baseSelect.disabled = false;
    filterInput.disabled = false;
    updatedText.textContent = (data.stale ? "Showing saved rates from " : "Rates updated ") + RN.formatUpdated(data.updated) + ". Source: ";
    var link = document.createElement("a");
    link.href = data.source.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = data.source.name;
    updatedText.append(link);
    render();
  }).catch(function () {
    status.textContent = "Exchange rates couldn't be loaded. Check your internet connection, then reload the page.";
  });
})();
