/* CUA-SWE site: episode player, paired chart, link wiring. No framework. */
(function () {
  "use strict";

  // ---- Links: edit here when the preprint and public repository URLs are final.
  var LINKS = {
    paper: null,  // set to the arXiv or PDF URL when the preprint is public; null hides the paper links
    code: "https://github.com/kingofspace0wzz/cua-swe",
    viewer: "https://kingofspace0wzz.github.io/cua-swe-viewer/",
    tasks: "tasks.html"
  };
  document.querySelectorAll("a[data-link]").forEach(function (a) {
    var key = a.getAttribute("data-link");
    if (LINKS[key]) a.href = LINKS[key];
    else if (a.parentNode.tagName === "LI") a.parentNode.remove();
    else a.remove();
  });

  // ---- The recorded Vector Relay episode. Every string below is taken from the retained
  // trajectory (paper/figure2_assets/cases/01_vector_relay): frame manifest, agent messages,
  // patch, shell outputs and verifier report.
  var EPISODE = {
    steps: [
      {
        channel: "gui",
        title: "Observe the failure in the running game",
        detail: "Launch the orb and watch the return. The relay stays ARMED, PULSE BALANCE marks the return FRACTURED, and the score is 0.",
        quote: "The UI confirms the baseline failure: the natural return ends as a red FRACTURED pulse with the relay still ARMED.",
        screen: { type: "image", src: "assets/media/vector-relay-frame-03.png",
                  alt: "Vector Relay after launch: RELAY ARMED, PULSE BALANCE shows a fractured mark, score 000000, message ORB REPLACED",
                  caption: "Screenshot 3 of 16, 10:04:30 UTC, after pressing Space to launch" }
      },
      {
        channel: "code",
        title: "Edit the ownership logic",
        detail: "Recall must withdraw the pending return; a natural replacement must hand it to the new owner. Two files change.",
        quote: "I’m adding explicit “withdraw” for manual recall and ownership handoff for natural replacement/receiver movement; contact de-duplication remains untouched.",
        screen: { type: "diff", files: [
          { name: "src/vector_relay.js", lines: [
            ["ctx", "  VectorRelay.prototype.attachBall = function (reason) {"],
            ["add", "+   var previousOwner = this.ball && this.ball.owner;"],
            ["add", "+   if (reason === \"manual-redock\") {"],
            ["add", "+     this.lane.withdraw(previousOwner);"],
            ["add", "+   }"],
            ["ctx", "    this.contacts.clear();"],
            ["ctx", "    …"],
            ["add", "+   if (reason === \"life-replacement\") {"],
            ["add", "+     this.lane.handoff(previousOwner, this.ball.owner);"],
            ["add", "+   }"],
            ["ctx", "  };"]
          ]},
          { name: "src/relay_commit.js", lines: [
            ["add", "+ RelayLane.prototype.withdraw = function (owner) {"],
            ["add", "+   … drop pending entries owned by the recalled orb"],
            ["add", "+ };"],
            ["add", "+ RelayLane.prototype.handoff = function (fromOwner, toOwner) {"],
            ["add", "+   … move pending entries to the replacement owner"],
            ["add", "+ };"]
          ]}
        ], caption: "Retained agent patch, excerpted; the full diff changes 2 files" }
      },
      {
        channel: "code",
        title: "Check the lane in Node, then build",
        detail: "A scripted recall, relaunch and two handoffs settle exactly once. A sustained overlap does not count twice. The build passes.",
        screen: { type: "shell", items: [
          { cmd: "node -e '… lane.withdraw(recalled) … lane.handoff(natural, replacement) … lane.take(14, shifted)'",
            out: "{\"pending\":0,\"withdrawn\":1,\"dropped\":0,\"nextDue\":null}" },
          { cmd: "node -e '… contacts.claim(body, tile) twice …'",
            out: "{\"first\":true,\"sustained\":false,\"series\":0}" },
          { cmd: "npm run build",
            out: "node --check src/relay_contact.js && node --check src/relay_commit.js && … && node --check server.mjs", ok: true }
        ], caption: "Shell events 17, 19 and 20 of the recorded trajectory, abbreviated" }
      },
      {
        channel: "gui",
        title: "Replay the route in the rebuilt game",
        detail: "Reload, launch, recall. CIRCUIT COMPLETE with +500, the relay reads CLEARED, and PULSE BALANCE shows one SEALED return.",
        quote: "The updated browser run now completes at exactly 500 points with one SEALED pulse and no FRACTURED pulse after natural replacement.",
        screen: { type: "image", src: "assets/media/vector-relay-frame-15.png",
                  alt: "Vector Relay after the repair: RELAY CLEARED, PULSE BALANCE shows a sealed mark, score 000500, message CIRCUIT COMPLETE +500",
                  caption: "Screenshot 15 of 16, 10:07:20 UTC, after reloading the rebuilt app and replaying" }
      },
      {
        channel: "verify",
        title: "Independent verification on a clean copy",
        detail: "The evaluator applies the submitted patch to a fresh copy of the project and runs the protected tests. The agent never sees them.",
        screen: { type: "verify", checks: [
          { name: "build", cmd: "npm run build", result: "exit code 0", pass: true },
          { name: "state", cmd: "verifiers/browser_check.py --url http://127.0.0.1:53500/?challenge=relay-circuit",
            result: "{\"status\": \"pass\", \"score\": 500, \"routes\": 1, \"browser_actions\": 4, \"recalls\": 1}", pass: true }
        ], summary: "success: true", caption: "Retained verifier report for the same attempt" }
      }
    ]
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderScreen(step) {
    var s = step.screen;
    var frag = document.createDocumentFragment();
    var media = el("div", "media");
    if (s.type === "image") {
      var img = el("img"); img.src = s.src; img.alt = s.alt; img.width = 1280; img.height = 720;
      media.appendChild(img);
    } else {
      var pane = el("div", "pane");
      if (s.type === "diff") {
        s.files.forEach(function (f) {
          pane.appendChild(el("div", "hdr", f.name));
          var pre = el("pre");
          f.lines.forEach(function (ln) { pre.appendChild(el("span", ln[0], ln[1] + "\n")); });
          pane.appendChild(pre);
        });
      } else if (s.type === "shell") {
        s.items.forEach(function (it) {
          var pre = el("pre");
          pre.appendChild(el("span", "cmd", "$ " + it.cmd + "\n"));
          pre.appendChild(el("span", it.ok ? "ok" : "out", it.out + "\n"));
          pane.appendChild(pre);
        });
      } else if (s.type === "verify") {
        s.checks.forEach(function (c) {
          var pre = el("pre");
          pre.appendChild(el("span", "hdr", c.name + ": " + c.cmd + "\n"));
          pre.appendChild(el("span", "out", c.result + "\n"));
          pre.appendChild(el("span", c.pass ? "ok" : "fail", c.pass ? "passed\n" : "failed\n"));
          pane.appendChild(pre);
        });
        pane.appendChild(el("pre", null, "")).appendChild(el("span", "ok", s.summary));
      }
      media.appendChild(pane);
    }
    frag.appendChild(media);
    var note = el("div", "note");
    note.appendChild(el("div", "cap", s.caption));
    if (step.quote) {
      var q = el("div", "quote");
      q.appendChild(el("span", null, "Agent, as recorded: "));
      q.appendChild(document.createTextNode("\u201c" + step.quote + "\u201d"));
      note.appendChild(q);
    }
    frag.appendChild(note);
    return frag;
  }

  function mountEpisode(root) {
    var screen = root.querySelector(".screen");
    var list = root.querySelector(".steps");
    var current = -1, timer = null, userTouched = false;
    EPISODE.steps.forEach(function (st, i) {
      var li = el("li"); li.setAttribute("data-channel", st.channel); li.setAttribute("role", "button"); li.tabIndex = 0;
      li.appendChild(el("span", "dot"));
      var body = el("div");
      body.appendChild(el("div", "t", (i + 1) + ". " + st.title));
      body.appendChild(el("div", "d", st.detail));
      li.appendChild(body);
      li.addEventListener("click", function () { userTouched = true; show(i); });
      li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); userTouched = true; show(i); } });
      list.appendChild(li);
    });
    function show(i) {
      if (i === current) return;
      current = i;
      screen.innerHTML = "";
      screen.appendChild(renderScreen(EPISODE.steps[i]));
      Array.prototype.forEach.call(list.children, function (li, j) { li.setAttribute("aria-current", j === i ? "true" : "false"); });
    }
    function tick() { if (!userTouched) show((current + 1) % EPISODE.steps.length); }
    show(0);
    timer = setInterval(tick, 6500);
    root.addEventListener("mouseenter", function () { clearInterval(timer); });
    root.addEventListener("mouseleave", function () { if (!userTouched) timer = setInterval(tick, 6500); });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { userTouched = true; show((current + 1) % EPISODE.steps.length); e.preventDefault(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { userTouched = true; show((current - 1 + EPISODE.steps.length) % EPISODE.steps.length); e.preventDefault(); }
    });
    // Preload the two screenshots so switching does not flash.
    ["assets/media/vector-relay-frame-03.png", "assets/media/vector-relay-frame-15.png"].forEach(function (u) { var im = new Image(); im.src = u; });
  }

  // ---- Paired comparison: identical tasks per model and domain, four domains weighted equally.
  // Counts are successes out of the matched task set: [code-only, computer use, tasks].
  // Web and Game use all 36 / 29 tasks; DevOps all 20; Mobile the tasks scorable in both conditions.
  var PAIRED = [
    { m: "GPT-6 Astra",     web: [10, 24, 36], game: [5, 11, 29], devops: [0, 16, 20], mobile: [0, 10, 19] },
    { m: "GPT-5.6 Sol",     web: [7, 21, 36],  game: [3, 3, 29],  devops: [0, 11, 20], mobile: [0, 9, 19] },
    { m: "GPT-5.6 Luna",    web: [4, 2, 36],   game: [0, 2, 29],  devops: [0, 3, 20],  mobile: [0, 7, 19] },
    { m: "GPT-5.6 Terra",   web: [4, 5, 36],   game: [1, 2, 29],  devops: [0, 5, 20],  mobile: [0, 7, 19] },
    { m: "Claude Opus 4.8", web: [6, 10, 36],  game: [1, 6, 29],  devops: [0, 11, 20], mobile: [0, 4, 12] },
    { m: "Claude Sonnet 5", web: [3, 0, 36],   game: [2, 1, 29],  devops: [0, 8, 20],  mobile: [0, 4, 16] },
    { m: "Claude Fable 5",  web: [7, 17, 36],  game: [4, 5, 29],  devops: [1, 11, 20], mobile: [1, 5, 8] },
    { m: "Grok 4.6",        web: [11, 20, 36], game: [3, 5, 29],  devops: [0, 13, 20], mobile: [0, 3, 8] }
  ];
  function mean(row, idx) {
    var ds = ["web", "game", "devops", "mobile"], s = 0;
    ds.forEach(function (d) { s += row[d][idx] / row[d][2]; });
    return 100 * s / 4;
  }
  function fmt1(x) { return (Math.round(x * 10 + 1e-9) / 10).toFixed(1); }

  function renderPaired(svg) {
    var rows = PAIRED.map(function (r) { return { m: r.m, code: mean(r, 0), cua: mean(r, 1) }; })
      .sort(function (a, b) { return b.cua - a.cua; });
    var cw = svg.parentNode.clientWidth || 960, narrow = cw < 620;
    var W = Math.max(cw, 320), L = narrow ? 16 : 150, R = narrow ? 56 : 70, rowH = narrow ? 50 : 40, top = narrow ? 34 : 30, H = top + rows.length * rowH + 30;
    var x = function (v) { return L + (W - L - R) * v / 100; };
    var ns = "http://www.w3.org/2000/svg";
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.innerHTML = "";
    function add(tag, attrs, text) {
      var n = document.createElementNS(ns, tag);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (text != null) n.textContent = text;
      svg.appendChild(n); return n;
    }
    (narrow ? [0, 25, 50, 75] : [0, 20, 40, 60, 80]).forEach(function (v) {
      add("line", { x1: x(v), x2: x(v), y1: top - 10, y2: H - 28, "class": "grid" });
      add("text", { x: x(v), y: H - 10, "text-anchor": "middle", "class": "axis" }, v + "%");
    });
    rows.forEach(function (r, i) {
      var y = top + i * rowH + (narrow ? rowH - 14 : rowH / 2);
      if (narrow) add("text", { x: L, y: y - 16, "class": "lbl" }, r.m);
      else add("text", { x: L - 14, y: y + 5, "text-anchor": "end", "class": "lbl" }, r.m);
      add("line", { x1: x(r.code), x2: x(r.cua), y1: y, y2: y, "class": "track" });
      add("circle", { cx: x(r.code), cy: y, r: 6.5, "class": "code" });
      add("circle", { cx: x(r.cua), cy: y, r: 7, "class": "cua" });
      add("text", { x: x(r.cua) + 14, y: y + 5, "class": "gain" }, "+" + fmt1(r.cua - r.code));
      if (!narrow) add("text", { x: x(r.code) - 12, y: y + 5, "text-anchor": "end" }, fmt1(r.code));
    });
    var lx = narrow ? L : L;
    add("circle", { cx: lx + 6, cy: 12, r: 6, "class": "code" });
    add("text", { x: lx + 18, y: 16 }, "code-only");
    add("circle", { cx: lx + 116, cy: 12, r: 6, "class": "cua" });
    add("text", { x: lx + 128, y: 16 }, "with computer use");
    if (!narrow) add("text", { x: lx + 268, y: 16, "class": "axis" }, "labels: gain in percentage points");
  }

  // ---- Table 1 of the paper. [code-only, with computer use] task success (%) per domain; null = not evaluated.
  var TABLE1 = {
    domains: [["web", "Web", 36], ["game", "Game", 29], ["devops", "DevOps", 20], ["mobile", "Mobile", 20]],
    rows: [
      { m: "GPT-6 Astra",          web: [27.8, 66.7], game: [17.2, 37.9], devops: [0.0, 80.0], mobile: [0.0, 55.0] },
      { m: "GPT-5.6 Sol",          web: [19.4, 58.3], game: [10.3, 10.3], devops: [0.0, 55.0], mobile: [0.0, 45.0] },
      { m: "GPT-5.6 Luna",         web: [11.1, 5.6],  game: [0.0, 6.9],   devops: [0.0, 15.0], mobile: [0.0, 36.8] },
      { m: "GPT-5.6 Terra",        web: [11.1, 13.9], game: [3.4, 6.9],   devops: [0.0, 25.0], mobile: [0.0, 36.8] },
      { m: "Claude Opus 5",        web: [22.2, 55.6], game: [13.8, 20.7], devops: [0.0, 60.0], mobile: [null, null] },
      { m: "Claude Opus 4.8",      web: [16.7, 27.8], game: [3.4, 20.7],  devops: [0.0, 55.0], mobile: [0.0, 50.0] },
      { m: "Claude Sonnet 5",      web: [8.3, 0.0],   game: [6.9, 3.4],   devops: [0.0, 40.0], mobile: [0.0, 35.0] },
      { m: "Claude Fable 5",       web: [19.4, 47.2], game: [13.8, 17.2], devops: [5.0, 55.0], mobile: [10.0, 53.3] },
      { m: "Grok 4.6",             web: [30.6, 55.6], game: [10.3, 17.2], devops: [0.0, 65.0], mobile: [0.0, 27.8] },
      { m: "Codex + GPT-5.6 Sol",  sys: true, web: [null, 55.6], game: [null, 17.2], devops: [null, 55.0], mobile: [null, 40.0] },
      { m: "Claude Code + Opus 5", sys: true, web: [null, 55.6], game: [null, 20.7], devops: [null, 65.0], mobile: [null, null] }
    ]
  };
  function colMax(d, i) {
    var mx = null;
    TABLE1.rows.forEach(function (r) { var v = r[d][i]; if (v != null && (mx == null || v > mx)) mx = v; });
    return mx;
  }
  function cell(tr, r, d, i, mx) {
    var v = r[d][i], td = el("td", "num" + (i === 1 ? " cua" : "") + (v != null && v === mx ? " max" : ""));
    td.textContent = v == null ? "\u2014" : v.toFixed(1);
    tr.appendChild(td);
  }
  function renderTable1(host) {
    host.innerHTML = "";
    var narrow = host.clientWidth < 700;
    if (!narrow) {
      var wrap = el("div", "table-scroll"), t = el("table", "t1"), thead = el("thead"), tr1 = el("tr"), tr2 = el("tr");
      t.appendChild(el("caption", null, "Task success rate (%) by domain. Code: code-only. CUA: with computer use. Column maxima in teal."));
      tr1.appendChild(el("th")); tr2.appendChild(el("th", null, "Model or system"));
      TABLE1.domains.forEach(function (d) {
        var th = el("th", null, d[1] + " (" + d[2] + ")"); th.colSpan = 2; tr1.appendChild(th);
        tr2.appendChild(el("th", "num", "Code")); tr2.appendChild(el("th", "num", "CUA"));
      });
      thead.appendChild(tr1); thead.appendChild(tr2); t.appendChild(thead);
      var tb = el("tbody");
      TABLE1.rows.forEach(function (r, ri) {
        var tr = el("tr", (r.sys ? "sys" : "") + (r.sys && !TABLE1.rows[ri - 1].sys ? " sep" : ""));
        tr.appendChild(el("td", null, r.m));
        TABLE1.domains.forEach(function (d) { cell(tr, r, d[0], 0, colMax(d[0], 0)); cell(tr, r, d[0], 1, colMax(d[0], 1)); });
        tb.appendChild(tr);
      });
      t.appendChild(tb); wrap.appendChild(t); host.appendChild(wrap);
    } else {
      host.appendChild(el("p", "t1-title", "Task success rate (%) by domain. Code: code-only. CUA: with computer use. Column maxima in teal."));
      TABLE1.domains.forEach(function (d) {
        var t = el("table", "t1 narrow"), thead = el("thead"), tr = el("tr");
        t.appendChild(el("caption", null, d[1] + ", " + d[2] + " tasks"));
        tr.appendChild(el("th", null, "Model or system")); tr.appendChild(el("th", "num", "Code")); tr.appendChild(el("th", "num", "CUA"));
        thead.appendChild(tr); t.appendChild(thead);
        var tb = el("tbody");
        TABLE1.rows.forEach(function (r, ri) {
          if (r[d[0]][0] == null && r[d[0]][1] == null) return;
          var row = el("tr", (r.sys ? "sys" : "") + (r.sys && !TABLE1.rows[ri - 1].sys ? " sep" : ""));
          row.appendChild(el("td", null, r.m)); cell(row, r, d[0], 0, colMax(d[0], 0)); cell(row, r, d[0], 1, colMax(d[0], 1));
          tb.appendChild(row);
        });
        t.appendChild(tb); host.appendChild(t);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var ep = document.getElementById("episode");
    if (ep) mountEpisode(ep);
    var chart = document.getElementById("paired-chart");
    var t1 = document.getElementById("table1");
    function layout() { if (chart) renderPaired(chart); if (t1) renderTable1(t1); }
    layout();
    var pending = null;
    window.addEventListener("resize", function () { clearTimeout(pending); pending = setTimeout(layout, 150); });
  });
})();
