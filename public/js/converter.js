/* Home page converter. */
(function () {
  "use strict";

  var RN = window.RateNote;
  var form = document.getElementById("converter");
  var amountInput = document.getElementById("amount");
  var amountHint = document.getElementById("amount-hint");
  var fromSelect = document.getElementById("from");
  var toSelect = document.getElementById("to");
  var swapButton = document.getElementById("swap");
  var result = document.getElementById("result");
  var resultFrom = document.getElementById("result-from");
  var resultTo = document.getElementById("result-to");
  var resultRates = document.getElementById("result-rates");
  var updatedText = document.getElementById("updated");
  var copyButton = document.getElementById("copy");
  var tableBody = document.getElementById("majors-body");
  var tableCaption = document.getElementById("majors-caption");

  var data = null;
  var state = { amount: "100", from: "USD", to: "EUR" };

  // Shareable links: ?amount=250&from=GBP&to=JPY
  var params = new URLSearchParams(window.location.search);
  if (params.get("amount")) state.amount = params.get("amount");
  if (/^[A-Za-z]{3}$/.test(params.get("from") || "")) state.from = params.get("from").toUpperCase();
  if (/^[A-Za-z]{3}$/.test(params.get("to") || "")) state.to = params.get("to").toUpperCase();
  amountInput.value = state.amount;

  function parseAmount(text) {
    var clean = String(text).replace(/[\s,]/g, "");
    if (clean === "" || !/^\d*\.?\d*$/.test(clean) || clean === ".") return NaN;
    return Number(clean);
  }

  function showMessage(text, isError) {
    result.classList.add("result--message");
    result.classList.toggle("result--error", !!isError);
    resultFrom.textContent = "";
    resultTo.textContent = text;
    resultRates.replaceChildren();
    copyButton.hidden = true;
  }

  function updateUrl() {
    var q = new URLSearchParams({ amount: state.amount, from: state.from, to: state.to });
    history.replaceState(null, "", window.location.pathname + "?" + q.toString());
  }

  function render() {
    if (!data) return;
    var amount = parseAmount(state.amount);
    if (isNaN(amount)) {
      amountHint.textContent = state.amount.trim() === "" ? "" : "Use digits only, like 1250.50";
      amountInput.setAttribute("aria-invalid", state.amount.trim() === "" ? "false" : "true");
      showMessage("Enter an amount to convert.");
      return;
    }
    amountHint.textContent = "";
    amountInput.setAttribute("aria-invalid", "false");

    var value = RN.convert(amount, state.from, state.to, data.rates);
    var rate = RN.convert(1, state.from, state.to, data.rates);
    result.classList.remove("result--message", "result--error");

    resultFrom.textContent = RN.formatNumber(amount) + " " + RN.name(state.from) + " =";
    var code = document.createElement("span");
    code.className = "code";
    code.textContent = state.to;
    resultTo.replaceChildren(document.createTextNode(RN.formatNumber(value)), code);

    var a = document.createElement("span");
    a.textContent = "1 " + state.from + " = " + RN.formatRate(rate) + " " + state.to;
    var b = document.createElement("span");
    b.textContent = "1 " + state.to + " = " + RN.formatRate(1 / rate) + " " + state.from;
    resultRates.replaceChildren(a, b);

    copyButton.hidden = false;
    copyButton.dataset.copy = RN.formatNumber(amount) + " " + state.from + " = " + RN.formatNumber(value) + " " + state.to;

    renderMajors(amount);
    updateUrl();
  }

  function renderMajors(amount) {
    tableCaption.textContent = RN.formatNumber(amount) + " " + RN.name(state.from) + " in other major currencies";
    var rows = RN.MAJORS.filter(function (c) { return c !== state.from && data.rates[c]; }).map(function (c) {
      var tr = document.createElement("tr");
      var cur = document.createElement("td");
      cur.innerHTML = '<span class="cur-code"></span><span class="cur-name"></span>';
      cur.firstChild.textContent = c;
      cur.lastChild.textContent = RN.name(c);
      var val = document.createElement("td");
      val.className = "num amount";
      val.textContent = RN.formatNumber(RN.convert(amount, state.from, c, data.rates));
      var rate = document.createElement("td");
      rate.className = "num";
      rate.textContent = RN.formatRate(RN.convert(1, state.from, c, data.rates));
      tr.append(cur, val, rate);
      return tr;
    });
    tableBody.replaceChildren.apply(tableBody, rows);
  }

  amountInput.addEventListener("input", function () { state.amount = amountInput.value; render(); });
  fromSelect.addEventListener("change", function () { state.from = fromSelect.value; render(); });
  toSelect.addEventListener("change", function () { state.to = toSelect.value; render(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); render(); });

  swapButton.addEventListener("click", function () {
    var from = state.from;
    state.from = state.to;
    state.to = from;
    fromSelect.value = state.from;
    toSelect.value = state.to;
    swapButton.classList.toggle("is-turning");
    render();
  });

  copyButton.addEventListener("click", function () {
    var text = copyButton.dataset.copy;
    var done = function () {
      copyButton.textContent = "Copied";
      setTimeout(function () { copyButton.textContent = "Copy result"; }, 2000);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
  });

  // Popular pair links fill in the converter instead of reloading the page.
  document.querySelectorAll("[data-pair]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (!data) return;
      e.preventDefault();
      var pair = link.getAttribute("data-pair").split("-");
      state.from = pair[0];
      state.to = pair[1];
      fromSelect.value = state.from;
      toSelect.value = state.to;
      render();
      document.getElementById("convert-heading").scrollIntoView({ behavior: "smooth", block: "start" });
      amountInput.focus({ preventScroll: true });
    });
  });

  showMessage("Loading today's exchange rates…");

  RN.load().then(function (loaded) {
    data = loaded;
    var codes = Object.keys(data.rates);
    if (codes.indexOf(state.from) === -1) state.from = "USD";
    if (codes.indexOf(state.to) === -1) state.to = "EUR";
    RN.fillSelect(fromSelect, codes, state.from);
    RN.fillSelect(toSelect, codes, state.to);
    fromSelect.disabled = false;
    toSelect.disabled = false;
    swapButton.disabled = false;

    updatedText.innerHTML = "";
    updatedText.append(
      (data.stale ? "Showing saved rates from " : "Rates updated ") + RN.formatUpdated(data.updated) + ". Source: "
    );
    var link = document.createElement("a");
    link.href = data.source.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = data.source.name;
    updatedText.append(link);
    render();
  }).catch(function () {
    showMessage("Exchange rates couldn't be loaded. Check your internet connection, then reload the page.", true);
  });
})();
