/* Task explorer: filter by domain, application and text; expand a row for the full instruction. */
(function () {
  "use strict";
  var LINKS = { code: "https://github.com/kingofspace0wzz/cua-swe", viewer: "https://kingofspace0wzz.github.io/cua-swe-viewer/" };
  document.querySelectorAll("a[data-link]").forEach(function (a) { var k = a.getAttribute("data-link"); if (LINKS[k]) a.href = LINKS[k]; });

  var DATA = window.CUA_SWE_TASKS, tasks = DATA.tasks;
  var DOMAIN = { web: "Web", game: "Game", devops: "DevOps", mobile: "Mobile" };
  var state = { domain: "all", family: "", q: "" };
  var list = document.getElementById("list"), count = document.getElementById("count"), famSel = document.getElementById("family");

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function minutes(s) { return Math.round(s / 60) + " min"; }

  function outcomeText(t) {
    var o = t.outcomes; if (!o) return "";
    return "code-only " + o.code.k + "/" + o.code.n + ", computer use " + o.cua.k + "/" + o.cua.n;
  }

  function row(t) {
    var li = el("li", "task"); li.id = t.id;
    var btn = el("button"); btn.type = "button"; btn.setAttribute("aria-expanded", "false");
    btn.appendChild(el("span", "dom", DOMAIN[t.domain]));
    var mid = el("span", "mid");
    var title = el("span", "title", t.title); mid.appendChild(title);
    mid.appendChild(el("span", "fam", t.family));
    mid.appendChild(el("span", "preview", t.instruction));
    btn.appendChild(mid);
    var right = el("span", "right");
    right.textContent = (t.tier_label ? t.tier_label + "\n" : "") + outcomeText(t);
    right.style.whiteSpace = "pre-line";
    btn.appendChild(right);
    li.appendChild(btn);

    var det = el("div", "detail");
    if (t.instruction_heading) det.appendChild(el("h3", null, t.instruction_heading)).style.marginBottom = "8px";
    det.appendChild(el("p", "instr", t.instruction));
    var dl = el("dl");
    function add(k, v) { if (v == null || v === "") return; dl.appendChild(el("dt", null, k)); dl.appendChild(el("dd", null, v)); }
    add("Task ID", t.id); dl.lastChild.className = "id";
    add("Budget", minutes(t.budgets.wall) + " wall time, " + t.budgets.steps + " agent steps" + (t.budgets.gui ? ", " + t.budgets.gui + " GUI actions" : ""));
    add("Tests", t.verifiers.join(", "));
    add("Viewport", t.viewport);
    if (t.seed != null) add("Seed", String(t.seed));
    add("Source", t.source);
    if (t.tier_label) add("Role", t.tier_label);
    det.appendChild(dl);
    if (t.outcomes) det.appendChild(el("p", "out", "Outcomes: " + t.outcomes.label + "."));
    var links = el("p", "out");
    var a1 = el("a", null, "Bundle in the repository"); a1.href = LINKS.code + "/tree/main/" + t.path; links.appendChild(a1);
    links.appendChild(document.createTextNode("  \u00b7  "));
    var a2 = el("a", null, "Data viewer"); a2.href = LINKS.viewer; links.appendChild(a2);
    det.appendChild(links);
    li.appendChild(det);

    btn.addEventListener("click", function () {
      var open = li.hasAttribute("open");
      if (open) { li.removeAttribute("open"); btn.setAttribute("aria-expanded", "false"); }
      else { li.setAttribute("open", ""); btn.setAttribute("aria-expanded", "true"); }
    });
    return li;
  }

  function families() {
    var seen = {}, out = [];
    tasks.forEach(function (t) {
      if (state.domain !== "all" && t.domain !== state.domain) return;
      if (!seen[t.family]) { seen[t.family] = 0; out.push(t.family); }
      seen[t.family] += 1;
    });
    out.sort(function (a, b) { return a.localeCompare(b); });
    famSel.innerHTML = "";
    var o0 = el("option", null, "All applications"); o0.value = ""; famSel.appendChild(o0);
    out.forEach(function (f) { var o = el("option", null, f + " (" + seen[f] + ")"); o.value = f; famSel.appendChild(o); });
    if (out.indexOf(state.family) < 0) state.family = "";
    famSel.value = state.family;
  }

  function render() {
    var q = state.q.trim().toLowerCase();
    var shown = tasks.filter(function (t) {
      if (state.domain !== "all" && t.domain !== state.domain) return false;
      if (state.family && t.family !== state.family) return false;
      if (q && (t.id + " " + t.title + " " + t.family + " " + t.instruction).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    list.innerHTML = "";
    shown.forEach(function (t) { list.appendChild(row(t)); });
    var byDom = {}; shown.forEach(function (t) { byDom[t.domain] = (byDom[t.domain] || 0) + 1; });
    var parts = Object.keys(DOMAIN).filter(function (d) { return byDom[d]; }).map(function (d) { return byDom[d] + " " + DOMAIN[d]; });
    count.textContent = shown.length + " of " + tasks.length + " tasks" + (parts.length > 1 ? " (" + parts.join(", ") + ")" : "");
    if (location.hash) { var target = document.getElementById(location.hash.slice(1)); if (target) { target.setAttribute("open", ""); target.scrollIntoView(); } }
  }

  document.querySelectorAll("#domain-seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      state.domain = b.getAttribute("data-domain");
      document.querySelectorAll("#domain-seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      families(); render();
    });
  });
  famSel.addEventListener("change", function () { state.family = famSel.value; render(); });
  document.getElementById("q").addEventListener("input", function (e) { state.q = e.target.value; render(); });

  var params = new URLSearchParams(location.search);
  if (params.get("domain") && DOMAIN[params.get("domain")]) {
    state.domain = params.get("domain");
    document.querySelectorAll("#domain-seg button").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-domain") === state.domain ? "true" : "false"); });
  }
  families(); render();
})();
