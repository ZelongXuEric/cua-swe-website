/* Browse the canonical tasks without altering the original instructions or outcomes. */
(function () {
  "use strict";
  var LINKS = { code: "https://github.com/kingofspace0wzz/cua-swe", viewer: "https://kingofspace0wzz.github.io/cua-swe-viewer/" };
  document.querySelectorAll("a[data-link]").forEach(function (a) { var url = LINKS[a.getAttribute("data-link")]; if (url) a.href = url; });
  var header = document.querySelector(".site-header");
  function updateHeader() { header.classList.toggle("scrolled", window.scrollY > 8); }
  updateHeader(); window.addEventListener("scroll", updateHeader, { passive: true });

  var tasks = window.CUA_SWE_TASKS.tasks;
  var DOMAIN = { web: "Web", game: "Game", devops: "DevOps", mobile: "Mobile" };
  var state = { domain: "all", family: "", q: "" };
  var list = document.getElementById("list"), count = document.getElementById("count"), family = document.getElementById("family"), query = document.getElementById("q");
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function minutes(seconds) { return Math.round(seconds / 60) + " min"; }
  function setOpen(li, open) {
    li.toggleAttribute("open", open);
    li.querySelector("button").setAttribute("aria-expanded", String(open));
    li.querySelector(".expand").textContent = open ? "−" : "+";
  }
  function row(task) {
    var li = el("li", "task"); li.id = task.id;
    var button = el("button"); button.type = "button";
    button.setAttribute("aria-expanded", "false"); button.setAttribute("aria-controls", "detail-" + task.id);
    button.appendChild(el("span", "dom", DOMAIN[task.domain]));
    button.appendChild(el("span", "title", task.title));
    var symbol = el("span", "expand", "+"); symbol.setAttribute("aria-hidden", "true"); button.appendChild(symbol);
    li.appendChild(button);
    var detail = el("div", "detail"); detail.id = "detail-" + task.id;
    if (task.instruction_heading) detail.appendChild(el("h3", null, task.instruction_heading));
    detail.appendChild(el("p", "instr", task.instruction));
    var dl = el("dl");
    function add(key, value, cls) { if (value == null || value === "") return; dl.appendChild(el("dt", null, key)); dl.appendChild(el("dd", cls, value)); }
    add("Task ID", task.id, "id");
    add("Application", task.family);
    add("Budget", minutes(task.budgets.wall) + " wall time, " + task.budgets.steps + " agent steps" + (task.budgets.gui ? ", " + task.budgets.gui + " GUI actions" : ""));
    add("Tests", task.verifiers.join(", "));
    add("Viewport", task.viewport);
    if (task.seed != null) add("Seed", String(task.seed));
    add("Source", task.source);
    add("Role", task.tier_label);
    detail.appendChild(dl);
    if (task.outcomes) {
      var outcomes = task.outcomes;
      detail.appendChild(el("p", "out", "Selected outcomes: code-only " + outcomes.code.k + "/" + outcomes.code.n + ", computer use " + outcomes.cua.k + "/" + outcomes.cua.n + ". " + outcomes.label + "."));
    }
    var links = el("div", "detail-links");
    var bundle = el("a", null, "View task bundle ↗"); bundle.href = LINKS.code + "/tree/main/" + task.path;
    var viewer = el("a", null, "Data viewer ↗"); viewer.href = LINKS.viewer;
    links.appendChild(bundle); links.appendChild(viewer); detail.appendChild(links);
    li.appendChild(detail);
    button.addEventListener("click", function () { setOpen(li, !li.hasAttribute("open")); });
    return li;
  }
  function updateDomainButtons() {
    document.querySelectorAll("#domain-seg button").forEach(function (button) { button.setAttribute("aria-pressed", String(button.getAttribute("data-domain") === state.domain)); });
  }
  function families() {
    var seen = {};
    tasks.forEach(function (task) {
      if (state.domain !== "all" && task.domain !== state.domain) return;
      seen[task.family] = (seen[task.family] || 0) + 1;
    });
    var names = Object.keys(seen).sort(function (a, b) { return a.localeCompare(b); });
    family.replaceChildren();
    var all = el("option", null, "All applications"); all.value = ""; family.appendChild(all);
    names.forEach(function (name) { var option = el("option", null, name + " (" + seen[name] + ")"); option.value = name; family.appendChild(option); });
    if (names.indexOf(state.family) < 0) state.family = "";
    family.value = state.family;
  }
  function render() {
    var q = state.q.trim().toLowerCase();
    var shown = tasks.filter(function (task) {
      if (state.domain !== "all" && task.domain !== state.domain) return false;
      if (state.family && task.family !== state.family) return false;
      return !q || (task.id + " " + task.title + " " + task.family + " " + task.instruction).toLowerCase().includes(q);
    });
    list.replaceChildren();
    shown.forEach(function (task) { list.appendChild(row(task)); });
    count.textContent = shown.length === tasks.length ? tasks.length + " tasks" : shown.length + " of " + tasks.length + " tasks";
    document.getElementById("empty").hidden = shown.length !== 0;
  }
  function followHash() {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (error) { return; }
    var task = tasks.find(function (entry) { return entry.id === id; });
    if (!task) return;
    var target = document.getElementById(id);
    if (!target) {
      state.domain = task.domain; state.family = ""; state.q = ""; query.value = "";
      updateDomainButtons(); families(); render(); target = document.getElementById(id);
    }
    setOpen(target, true); target.scrollIntoView();
  }
  document.querySelectorAll("#domain-seg button").forEach(function (button) {
    button.addEventListener("click", function () { state.domain = button.getAttribute("data-domain"); updateDomainButtons(); families(); render(); });
  });
  family.addEventListener("change", function () { state.family = family.value; render(); });
  query.addEventListener("input", function () { state.q = query.value; render(); });
  document.getElementById("clear-filters").addEventListener("click", function () {
    state = { domain: "all", family: "", q: "" }; query.value = "";
    updateDomainButtons(); families(); render(); query.focus();
  });
  var domain = new URLSearchParams(location.search).get("domain");
  if (DOMAIN[domain]) state.domain = domain;
  updateDomainButtons(); families(); render(); followHash();
  window.addEventListener("hashchange", followHash);
})();
