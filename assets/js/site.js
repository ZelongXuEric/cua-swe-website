/* CUA-SWE: results charts and table (final evaluation report, 2026-09-24; arXiv 2609.32600v1), plus the retained episode evidence. */
(function () {
  "use strict";
  var LINKS = {
    paper: "https://arxiv.org/abs/2609.32600",
    pdf: "https://arxiv.org/pdf/2609.32600",
    code: "https://github.com/kingofspace0wzz/cua-swe",
    viewer: "https://kingofspace0wzz.github.io/cua-swe-viewer/"
  };
  document.querySelectorAll("a[data-link]").forEach(function (a) {
    var url = LINKS[a.getAttribute("data-link")];
    if (url) a.href = url; else a.remove();
  });

  // Pass@1 task success (%) from paper/evaluation/final-evaluation-report.md (2026-09-24).
  var DOMAINS = [["web", "Web", 36], ["game", "Game", 29], ["devops", "DevOps", 20], ["mobile", "Mobile", 20]];
  var TABLE1 = [
    { m: "GPT-6 Astra",          fam: "openai",    web: [27.8, 66.7], game: [17.2, 37.9], devops: [0.0, 80.0], mobile: [0.0, 55.0] },
    { m: "GPT-5.6 Sol",          fam: "openai",    web: [19.4, 58.3], game: [10.3, 10.3], devops: [0.0, 55.0], mobile: [0.0, 45.0] },
    { m: "GPT-5.6 Luna",         fam: "openai",    web: [11.1, 5.6],  game: [0.0, 6.9],   devops: [0.0, 15.0], mobile: [0.0, 35.0] },
    { m: "GPT-5.6 Terra",        fam: "openai",    web: [11.1, 13.9], game: [3.4, 6.9],   devops: [0.0, 25.0], mobile: [0.0, 35.0] },
    { m: "Opus 5",               fam: "anthropic", web: [22.2, 55.6], game: [13.8, 20.7], devops: [0.0, 60.0], mobile: [null, null], deferredMobile: true },
    { m: "Opus 4.8",             fam: "anthropic", web: [16.7, 27.8], game: [3.4, 20.7],  devops: [0.0, 55.0], mobile: [0.0, 40.0] },
    { m: "Sonnet 5",             fam: "anthropic", web: [8.3, 0.0],   game: [6.9, 3.4],   devops: [0.0, 40.0], mobile: [0.0, 35.0] },
    { m: "Fable 5",              fam: "anthropic", web: [19.4, 47.2], game: [13.8, 17.2], devops: [5.0, 55.0], mobile: [5.0, 40.0] },
    { m: "Grok 4.6",             fam: "xai",       web: [30.6, 55.6], game: [10.3, 17.2], devops: [0.0, 65.0], mobile: [0.0, 30.0] },
    { m: "Codex + Sol",          fam: "system", sys: true, web: [null, 55.6], game: [null, 17.2], devops: [null, 55.0], mobile: [null, 40.0] },
    { m: "Claude Code + Opus 5", fam: "system", sys: true, web: [null, 55.6], game: [null, 20.7], devops: [null, 65.0], mobile: [null, null], deferredMobile: true }
  ];
  // Model colors follow the paper's figures: one hue per model, families share a range.
  var COLOR = {
    "GPT-6 Astra": "#1f9d8f", "GPT-5.6 Sol": "#3f8ecb", "GPT-5.6 Terra": "#2e5d8f", "GPT-5.6 Luna": "#8d8bd8",
    "Opus 5": "#d2603a", "Opus 4.8": "#e39a6c", "Sonnet 5": "#b8963a", "Fable 5": "#a5545a",
    "Grok 4.6": "#4d5566", "Codex + Sol": "#7a5fc7", "Claude Code + Opus 5": "#9c7b62"
  };
  // Panel a: four-domain mean for the eight frontier models evaluated under both conditions in every
  // domain (Opus 5 is deferred on Mobile), each domain weighted equally. This reproduces the right
  // panel of Figure 1 in the paper (GPT-6 Astra 11.3 -> 59.9, gains from 12.8 to 48.6 points).
  function fourDomainMean(row, i) {
    var vals = DOMAINS.map(function (d) { return row[d[0]][i]; });
    if (vals.some(function (v) { return v == null; })) return null;
    return Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length * 10) / 10;
  }
  var MEAN = TABLE1.filter(function (r) { return !r.sys && fourDomainMean(r, 0) != null; })
    .map(function (r) { return { m: r.m, code: fourDomainMean(r, 0), cua: fourDomainMean(r, 1) }; })
    .sort(function (a, b) { return b.cua - a.cua; });

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }

  // Grouped bars: a light and a solid bar per model in the model's own hue, value labels, optional gain labels.
  function drawGrouped(el, rows, o) {
    o = o || {};
    var W = o.w || 640, H = o.h || 300, padL = 34, padR = 8, padT = 22, padB = o.padB || 66;
    var innerW = W - padL - padR, innerH = H - padT - padB, n = rows.length, group = innerW / n;
    var bw = Math.min(o.bw || 22, group * 0.36), gap = 3, fs = o.fs || 10.5;
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || "Grouped bar chart") + '">'];
    [0, 20, 40, 60, 80, 100].forEach(function (v) {
      var y = padT + innerH - innerH * v / 100;
      s.push('<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '" stroke="#e6e6e6"/>');
      s.push('<text x="' + (padL - 5) + '" y="' + (y + 3.5) + '" text-anchor="end" font-size="10" fill="#666">' + v + '</text>');
    });
    rows.forEach(function (r, i) {
      var cx = padL + group * i + group / 2, color = COLOR[r.m] || "#888";
      [["code", r.code], ["cua", r.cua]].forEach(function (b, j) {
        var v = b[1], x = cx - bw - gap / 2 + j * (bw + gap);
        if (v == null) {
          var both = r.code == null && r.cua == null;
          if (j === 0) s.push('<text x="' + (both ? cx : x + bw / 2) + '" y="' + (padT + innerH - 3) + '" text-anchor="middle" font-size="9.5" fill="#888">' + (r.deferred ? "deferred" : "\u2014") + '</text>');
          return;
        }
        var h = innerH * v / 100, y = padT + innerH - h;
        var title = r.m + ", " + (j ? "Hybrid" : "Code-only") + ": " + v.toFixed(1) + "%" + (r.n ? " (" + Math.round(v * r.n / 100) + "/" + r.n + " tasks)" : "");
        s.push('<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + Math.max(h, 1.5) + '" fill="' + color + '"' + (j ? '' : ' fill-opacity="0.35"') + '><title>' + esc(title) + '</title></rect>');
        s.push('<text x="' + (x + bw / 2) + '" y="' + (y - 3) + '" text-anchor="middle" font-size="' + fs + '" font-weight="' + (j ? 700 : 400) + '" fill="' + (j ? "#222" : "#666") + '">' + v.toFixed(1) + '</text>');
      });
      if (o.gain && r.code != null && r.cua != null) {
        var d = r.cua - r.code, yTop = padT + innerH - innerH * Math.max(r.cua, r.code) / 100 - 15;
        s.push('<text x="' + cx + '" y="' + yTop + '" text-anchor="middle" font-size="11" font-weight="700" fill="#d93025">' + (d >= 0 ? "+" : "") + d.toFixed(1) + '</text>');
      }
      s.push('<text transform="translate(' + cx + ',' + (padT + innerH + 12) + ') rotate(-32)" text-anchor="end" font-size="10.5" fill="#444">' + esc(r.m) + '</text>');
    });
    s.push('</svg>'); el.innerHTML = s.join("");
  }

  // Narrow screens: the same data as horizontal bars, model names as row labels, no rotation and no scrolling.
  function drawHorizontal(el, rows, o) {
    o = o || {};
    var W = 360, padL = 112, padR = 40, padT = 18, padB = 6, bh = 11, gap = 2, rowH = bh * 2 + gap + 11, fs = 10.5;
    var innerW = W - padL - padR, H = padT + rows.length * rowH + padB;
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || "Grouped bar chart") + '">'];
    [0, 25, 50, 75, 100].forEach(function (v) {
      var x = padL + innerW * v / 100;
      s.push('<line x1="' + x + '" x2="' + x + '" y1="' + padT + '" y2="' + (H - padB) + '" stroke="#e6e6e6"/>');
      s.push('<text x="' + x + '" y="' + (padT - 6) + '" text-anchor="middle" font-size="9.5" fill="#666">' + v + '</text>');
    });
    rows.forEach(function (r, i) {
      var y0 = padT + i * rowH + 4, color = COLOR[r.m] || "#888";
      s.push('<text x="' + (padL - 6) + '" y="' + (y0 + bh + 4) + '" text-anchor="end" font-size="' + fs + '" fill="#333">' + esc(r.m) + '</text>');
      [["code", r.code], ["cua", r.cua]].forEach(function (b, j) {
        var v = b[1], y = y0 + j * (bh + gap);
        if (v == null) {
          if (j === 0) s.push('<text x="' + (padL + 3) + '" y="' + (y0 + bh + 4) + '" font-size="9.5" fill="#888">' + (r.deferred ? "deferred" : "\u2014") + '</text>');
          return;
        }
        var w = innerW * v / 100, title = r.m + ", " + (j ? "Hybrid" : "Code-only") + ": " + v.toFixed(1) + "%";
        s.push('<rect x="' + padL + '" y="' + y + '" width="' + Math.max(w, 1.5) + '" height="' + bh + '" fill="' + color + '"' + (j ? '' : ' fill-opacity="0.35"') + '><title>' + esc(title) + '</title></rect>');
        var label = v.toFixed(1);
        if (o.gain && j === 1 && r.code != null) { var d = r.cua - r.code; label += ' <tspan fill="#d93025" font-weight="700">' + (d >= 0 ? "+" : "") + d.toFixed(1) + '</tspan>'; }
        s.push('<text x="' + (padL + w + 4) + '" y="' + (y + bh - 2) + '" font-size="' + (j ? fs : 9.5) + '" font-weight="' + (j ? 700 : 400) + '" fill="' + (j ? "#222" : "#666") + '">' + label + '</text>');
      });
    });
    s.push('</svg>'); el.innerHTML = s.join("");
  }

  function renderTable(host) {
    var maxima = {};
    DOMAINS.forEach(function (d) { [0, 1].forEach(function (i) {
      maxima[d[0] + i] = Math.max.apply(null, TABLE1.map(function (r) { return r[d[0]][i] == null ? -1 : r[d[0]][i]; }));
    }); });
    var h = ['<table class="score-table"><thead><tr><th rowspan="2">Model / system</th>'];
    DOMAINS.forEach(function (d) { h.push('<th class="group" colspan="2">' + d[1] + ' (' + d[2] + ')</th>'); });
    h.push('</tr><tr>');
    DOMAINS.forEach(function () { h.push('<th>Code</th><th>Hybrid</th>'); });
    h.push('</tr></thead><tbody>');
    TABLE1.forEach(function (r, idx) {
      h.push('<tr' + (r.sys && !TABLE1[idx - 1].sys ? ' class="system-start"' : '') + '><th scope="row">' + esc(r.m) + '</th>');
      DOMAINS.forEach(function (d) { [0, 1].forEach(function (i) {
        var v = r[d[0]][i];
        if (v == null) {
          var deferred = r.deferredMobile && d[0] === "mobile";
          h.push('<td class="na" title="' + (deferred ? "Evaluation deferred" : "Not evaluated") + '">' + (deferred ? "def." : "—") + '</td>');
        } else {
          var k = Math.round(v * d[2] / 100);
          h.push('<td class="' + (i ? "cua" : "code") + (v === maxima[d[0] + i] ? " best" : "") + '" title="' + k + ' / ' + d[2] + ' tasks">' + v.toFixed(1) + '</td>');
        }
      }); });
      h.push('</tr>');
    });
    h.push('</tbody></table>'); host.innerHTML = h.join("");
  }

  var narrow = window.matchMedia("(max-width: 720px)");
  function drawCharts() {
    var draw = narrow.matches ? drawHorizontal : drawGrouped;
    var mean = document.getElementById("chart-mean");
    if (mean) draw(mean, MEAN, { w: 640, h: 300, bw: 26, gain: true, fs: 11, label: "Four-domain mean task success, Code-only and Hybrid, eight API models" });
    DOMAINS.forEach(function (d) {
      var el = document.querySelector('[data-chart="' + d[0] + '"]'); if (!el) return;
      var rows = TABLE1.map(function (r) { return { m: r.m, code: r[d[0]][0], cua: r[d[0]][1], n: d[2], deferred: r.deferredMobile && d[0] === "mobile" }; });
      draw(el, rows, { w: 520, h: 274, bw: 16, fs: 9.5, padB: 88, label: d[1] + " task success, Code-only and Hybrid" });
      var cap = document.createElement("div"); cap.className = "chart-title"; cap.textContent = d[1] + " (" + d[2] + " tasks)";
      el.insertBefore(cap, el.firstChild);
    });
  }
  function mountResults() {
    drawCharts();
    if (narrow.addEventListener) narrow.addEventListener("change", drawCharts);
    var table = document.getElementById("results-table");
    if (table) renderTable(table);
  }

  // Recorded runs. Every screenshot, patch excerpt, shell output and verifier result is retained evidence
  // from the named attempt; nothing is reconstructed. Sources are listed in assets/media/manifest.json.
  // The step player uses the same layout and controls as the timed replays (assets/js/replay.js),
  // but advances one curated step at a time.
  var EPISODE = {
    kicker: "Game · Vector Relay",
    title: "One return, counted once.",
    summary: "The player launches an orb at a relay; when the orb returns, the relay should clear and score. The agent sees the stuck relay in the game, hands the pending return to the replacement orb, tests the logic from the shell and confirms the fix in the rebuilt game.",
    instruction: "Make a return count exactly once after the orb falls out and a replacement docks, and not at all after the player recalls the orb.",
    highlight: "exactly once",
    taskId: "gameqa.vector-relay-primed-pulse-balance-handoff.011",
    run_text: "GPT-5.6 Sol · Hybrid access · the task’s three matched trials: code-only 0/3 · hybrid 1/3",
    frames: [
      { src: "assets/media/vector-relay-frame-03.png", n: 3, time: "10:04:30",
        alt: "Vector Relay after launch: RELAY ARMED, PULSE BALANCE shows a fractured mark, score 000000, message ORB REPLACED" },
      { src: "assets/media/vector-relay-frame-15.png", n: 15, time: "10:07:20",
        alt: "Vector Relay after the repair: RELAY CLEARED, PULSE BALANCE shows a sealed mark, score 000500, message CIRCUIT COMPLETE +500" }
    ],
    total: 16,
    steps: [
      { title: "See the bug in the running game", frame: 0,
        entries: [{ kind: "gui", text: "Press Space to launch", frame: 0 }],
        insight: "A replacement orb has docked, but the relay is still armed, PULSE BALANCE marks the return as fractured and the score is 000000." },
      { title: "Change which orb owns a pending return", frame: 0,
        entries: [
          { kind: "edit", cmd: "src/vector_relay.js", lines: [
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
            ["ctx", "  };"] ] },
          { kind: "edit", cmd: "src/relay_commit.js", lines: [
            ["add", "+ RelayLane.prototype.withdraw = function (owner) {"],
            ["add", "+   … drop pending entries owned by the recalled orb"],
            ["add", "+ };"],
            ["add", "+ RelayLane.prototype.handoff = function (fromOwner, toOwner) {"],
            ["add", "+   … move pending entries to the replacement owner"],
            ["add", "+ };"] ] } ],
        insight: "On a manual recall the pending return is withdrawn; when a replacement docks it is handed to the new orb, so it can still score." },
      { title: "Test the new logic from the shell", frame: 0,
        entries: [
          { kind: "shell", cmd: "node -e '… lane.withdraw(recalled) … lane.handoff(natural, replacement) … lane.take(14, shifted)'", out: "{\"pending\":0,\"withdrawn\":1,\"dropped\":0,\"nextDue\":null}" },
          { kind: "shell", cmd: "node -e '… contacts.claim(body, tile) twice …'", out: "{\"first\":true,\"sustained\":false,\"series\":0}" },
          { kind: "shell", cmd: "npm run build", out: "node --check src/relay_contact.js && node --check src/relay_commit.js && … && node --check server.mjs" } ],
        insight: "Two Node scripts exercise recall, handoff and duplicate contacts without the game; the build passes." },
      { title: "Replay in the rebuilt game", frame: 1,
        entries: [{ kind: "gui", text: "Reload the rebuilt app and replay", frame: 1 }],
        insight: "The same play now clears the relay: CIRCUIT COMPLETE, score 000500." },
      { title: "Verify on a clean copy", frame: 1, verify: true,
        insight: "The evaluator applies the patch to a fresh project, rebuilds it and replays the challenge in a browser: score 500, one recall, pass." }
    ],
    verifier: [
      { command: "npm run build", stdout: "exit code 0" },
      { command: "verifiers/browser_check.py --url http://127.0.0.1:53500/?challenge=relay-circuit",
        stdout: "{\"status\": \"pass\", \"score\": 500, \"routes\": 1, \"browser_actions\": 4, \"recalls\": 1}" } ],
    end_note: "Screenshots, patch excerpts, shell output and the verifier report come from this attempt; the full diff changes 2 files."
  };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function mountEpisode(root, ep) {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)"), last = ep.steps.length - 1;
    var st = { step: reduced.matches ? last : -1, playing: false, manual: false, visible: false, loop: true, speed: 1, timer: 0 };
    function pad(n) { return String(n).padStart(2, "0"); }

    var head = el("header", "rp-head");
    head.appendChild(el("p", "rp-kicker", ep.kicker));
    head.appendChild(el("h3", null, ep.title));
    head.appendChild(el("p", "rp-summary", ep.summary));
    root.appendChild(head);
    var task = el("div", "rp-task"), instruction = el("p", "rp-instruction"), at = ep.instruction.indexOf(ep.highlight);
    task.appendChild(el("span", "rp-label", "Task instruction"));
    instruction.appendChild(document.createTextNode(ep.instruction.slice(0, at)));
    instruction.appendChild(el("mark", null, ep.highlight));
    instruction.appendChild(document.createTextNode(ep.instruction.slice(at + ep.highlight.length) + " "));
    var link = el("a", null, "Full instruction"); link.href = "tasks.html#" + ep.taskId; instruction.appendChild(link);
    task.appendChild(instruction);
    task.appendChild(el("p", "rp-run", ep.run_text));
    root.appendChild(task);

    var nav = el("ol", "rp-stages"), stageButtons = [];
    nav.setAttribute("aria-label", "Repair steps");
    ep.steps.forEach(function (step, i) {
      var li = el("li"), b = el("button"); b.type = "button";
      b.appendChild(el("span", "n", pad(i + 1)));
      b.appendChild(el("span", "t", step.title));
      b.addEventListener("click", function () { go(i, true); });
      b.addEventListener("keydown", function (event) {
        var to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: last }[event.key];
        if (to == null) return;
        event.preventDefault(); to = (to + ep.steps.length) % ep.steps.length;
        stageButtons[to].focus(); go(to, true);
      });
      li.appendChild(b); nav.appendChild(li); stageButtons.push(b);
    });
    root.appendChild(nav);

    var grid = el("div", "rp-grid"), col = el("section", "rp-col"), stream = el("div", "rp-stream");
    col.setAttribute("aria-label", "Agent and environment record");
    var colHead = el("div", "rp-col-head"), badge = el("span", "rp-status", "Ready");
    colHead.appendChild(el("span", null, "Agent ↔ Environment")); colHead.appendChild(badge);
    stream.tabIndex = 0; stream.setAttribute("role", "region");
    stream.setAttribute("aria-label", "Recorded agent actions and outputs, step by step.");
    col.appendChild(colHead); col.appendChild(stream);
    var browser = el("aside", "rp-browser"), bar = el("div", "rp-bar"), view = el("div", "rp-view");
    browser.setAttribute("aria-label", "Recorded game screenshots");
    var open = el("a"), img = el("img"), empty = el("p", "rp-empty", "The game appears when the agent first looks at it.");
    open.target = "_blank"; open.rel = "noopener"; open.title = "Open the full-size screenshot";
    img.width = 1280; img.height = 720; img.hidden = true;
    open.appendChild(img); view.appendChild(open); view.appendChild(empty);
    browser.appendChild(bar); browser.appendChild(view);
    browser.appendChild(el("p", "rp-frame-note", "Retained screenshots from this attempt. Select a screenshot to open it full size."));
    grid.appendChild(col); grid.appendChild(browser); root.appendChild(grid);

    var controls = el("div", "rp-controls");
    function button(label, text, cls) { var b = el("button", cls || "rp-btn", text); b.type = "button"; b.setAttribute("aria-label", label); controls.appendChild(b); return b; }
    var playBtn = button("Play steps", "▶ Play", "rp-play"), prevBtn = button("Previous step", "←"), nextBtn = button("Next step", "→"), againBtn = button("Play from start", "↺ Replay");
    var loopLabel = el("label", "rp-opt"), loopBox = el("input"); loopBox.type = "checkbox"; loopBox.checked = true;
    loopLabel.appendChild(loopBox); loopLabel.appendChild(document.createTextNode(" Loop")); controls.appendChild(loopLabel);
    var position = el("span", "rp-pos"); controls.appendChild(position);
    var speedLabel = el("label", "rp-opt rp-speed", "Speed "), speed = el("select");
    [0.5, 1, 1.5, 2].forEach(function (v) { var o = el("option", null, v + "×"); o.value = v; o.selected = v === 1; speed.appendChild(o); });
    speedLabel.appendChild(speed); controls.appendChild(speedLabel);
    controls.appendChild(el("span", "rp-disclosure", "Step player · real screenshots · outputs excerpted"));
    root.appendChild(controls);
    var seekBar = el("input", "rp-seek"); seekBar.type = "range"; seekBar.min = 0; seekBar.max = last; seekBar.step = 1;
    seekBar.setAttribute("aria-label", "Step"); root.appendChild(seekBar);
    var announcer = el("p", "sr-only"); announcer.setAttribute("aria-live", "polite"); root.appendChild(announcer);

    function entry(e) {
      if (e.kind === "gui") {
        var row = el("div", "rp-entry rp-row gui");
        row.appendChild(el("span", "rp-who", "Browser")); row.appendChild(el("span", "rp-what", e.text));
        row.appendChild(el("span", "rp-chip", "Screenshot " + ep.frames[e.frame].n));
        return row;
      }
      var box = el("div", "rp-entry rp-cmd" + (e.kind === "edit" ? " edit" : "")), pre = el("pre");
      box.appendChild(el("span", "rp-who", e.kind === "edit" ? "Edit" : "Shell"));
      pre.appendChild(el("span", "c", (e.kind === "edit" ? "" : "$ ") + e.cmd + "\n"));
      if (e.lines) e.lines.forEach(function (l) { pre.appendChild(el("span", l[0], l[1] + "\n")); });
      else pre.appendChild(el("span", "o", e.out));
      box.appendChild(pre);
      return box;
    }
    function verifyCard() {
      var card = el("div", "rp-verify"), top = el("div", "rp-verify-head");
      top.appendChild(el("span", "rp-who", "Independent verifier")); top.appendChild(el("strong", "rp-good", "Passed"));
      card.appendChild(top);
      ep.verifier.forEach(function (v) {
        var pre = el("pre"); pre.appendChild(el("span", "c", "$ " + v.command + "\n")); pre.appendChild(el("span", "o", v.stdout)); card.appendChild(pre);
      });
      card.appendChild(el("p", null, ep.end_note));
      return card;
    }
    function render() {
      var s = st.step;
      stream.replaceChildren();
      for (var i = 0; i <= s; i++) {
        var step = ep.steps[i], mark = el("div", "rp-stage-mark");
        mark.appendChild(el("span", "n", pad(i + 1))); mark.appendChild(el("span", null, step.title));
        stream.appendChild(mark);
        (step.entries || []).forEach(function (e) { stream.appendChild(entry(e)); });
        if (step.verify) stream.appendChild(verifyCard());
        var p = el("p", "rp-insight"); p.appendChild(el("span", "rp-tag", "Summary")); p.appendChild(el("span", null, step.insight));
        stream.appendChild(p);
      }
      stream.scrollTop = stream.scrollHeight;
      var f = s < 0 ? null : ep.frames[ep.steps[s].frame];
      empty.hidden = !!f; img.hidden = !f;
      bar.textContent = f ? "Screenshot " + f.n + " of " + ep.total + " · " + f.time + " UTC" : "Game · no screenshot yet";
      if (f && img.getAttribute("src") !== f.src) {
        img.src = open.href = f.src; img.alt = f.alt;
        if (!reduced.matches && img.animate) img.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 250 });
      }
      stageButtons.forEach(function (b, i) {
        b.setAttribute("aria-current", i === s ? "step" : "false");
        b.classList.toggle("done", i < s || (i === s && s === last));
      });
      position.textContent = (s + 1) + " / " + ep.steps.length;
      seekBar.value = Math.max(0, s);
      badge.textContent = s === last ? "Complete" : st.playing ? "Playing" : s >= 0 ? "Paused" : "Ready";
      playBtn.textContent = st.playing ? "❚❚ Pause" : "▶ Play";
      playBtn.setAttribute("aria-label", st.playing ? "Pause steps" : "Play steps");
      if (s >= 0) announcer.textContent = "Step " + (s + 1) + " of " + ep.steps.length + ": " + ep.steps[s].title;
    }
    // Each step stays up long enough to read; at the end it holds, then loops like the replays.
    function schedule() {
      clearTimeout(st.timer);
      st.timer = setTimeout(function () {
        if (st.step < last) { st.step++; render(); schedule(); }
        else if (st.loop && st.visible && !document.hidden) { st.step = 0; render(); schedule(); }
        else { st.playing = false; render(); }
      }, (st.step === last ? 6000 : st.step < 0 ? 300 : 5200) / st.speed);
    }
    function play() {
      if (st.step === last) st.step = -1;
      st.playing = true; st.manual = false; render(); schedule();
    }
    function pause(manual) {
      clearTimeout(st.timer); st.timer = 0; st.playing = false;
      if (manual) st.manual = true;
      render();
    }
    function go(i, manual) { pause(manual); st.step = Math.max(0, Math.min(last, i)); render(); }

    playBtn.addEventListener("click", function () { if (st.playing) pause(true); else play(); });
    againBtn.addEventListener("click", function () { st.step = -1; play(); });
    prevBtn.addEventListener("click", function () { go(st.step - 1, true); });
    nextBtn.addEventListener("click", function () { go(st.step + 1, true); });
    loopBox.addEventListener("change", function () { st.loop = loopBox.checked; });
    speed.addEventListener("change", function () { st.speed = Number(speed.value); if (st.playing) schedule(); });
    seekBar.addEventListener("input", function () { go(Number(seekBar.value), true); });
    ["wheel", "touchstart", "pointerdown"].forEach(function (type) {
      stream.addEventListener(type, function () { if (st.playing) pause(true); }, { passive: true });
    });

    // Autoplay while visible; reduced motion shows every step instead.
    render();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        st.visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.18;
        if (!st.visible) { if (st.playing) pause(); }
        else if (!st.manual && !reduced.matches && !document.hidden && !st.playing) play();
      }, { threshold: [0, 0.18, 0.4] }).observe(grid);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (st.playing) pause(); }
      else if (st.visible && !st.manual && !reduced.matches && !st.playing) play();
    });
  }

  // Overview strip: every column shows the bug or the repaired application, chosen by tab. Without JS the bug shows.
  function mountStrip(root) {
    var seg = root.querySelector(".seg"), buttons = [];
    function select(index) {
      root.classList.toggle("show-fixed", index === 1);
      buttons.forEach(function (button, i) { button.setAttribute("aria-pressed", String(i === index)); });
    }
    ["Bug", "Repaired"].forEach(function (label, i) {
      var button = el("button", null, label); button.type = "button";
      button.addEventListener("click", function () { select(i); });
      seg.appendChild(button); buttons.push(button);
    });
    select(0);
  }

  // Examples and repair cases: one panel at a time, chosen by tab. Without JS every panel stacks.
  function mountTabs(root) {
    var seg = root.querySelector(".seg"), panels = Array.prototype.slice.call(root.querySelectorAll(":scope > [data-tab]")), buttons = [];
    root.classList.add("js");
    function select(index) {
      panels.forEach(function (panel, i) { panel.classList.toggle("current", i === index); });
      buttons.forEach(function (button, i) { button.setAttribute("aria-pressed", String(i === index)); });
    }
    panels.forEach(function (panel, i) {
      var label = panel.getAttribute("data-tab").split(" · "), button = el("button"); button.type = "button";
      if (label.length > 1) button.appendChild(el("small", null, label[0]));
      button.appendChild(document.createTextNode(label[label.length - 1]));
      button.addEventListener("click", function () { select(i); });
      seg.appendChild(button); buttons.push(button);
    });
    select(0);
  }

  function mountLightbox() {
    var box = document.getElementById("lightbox"); if (!box) return;
    var img = box.querySelector("img");
    function close() { box.hidden = true; img.src = ""; document.body.style.overflow = ""; }
    document.querySelectorAll(".zoomable img").forEach(function (source) {
      source.addEventListener("click", function () { img.src = source.currentSrc || source.src; img.alt = source.alt; box.hidden = false; document.body.style.overflow = "hidden"; });
    });
    box.addEventListener("click", close);
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !box.hidden) close(); });
  }

  // Navigation marks the section being read.
  function mountScrollspy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav ul a[href^="#"]'));
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    if (!links.length || !("IntersectionObserver" in window)) return;
    var shown = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { shown[e.target.id] = e.isIntersecting; });
      var current = -1;
      sections.forEach(function (sec, i) { if (sec && shown[sec.id] && current < 0) current = i; });
      links.forEach(function (a, i) { a.classList.toggle("active", i === current); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (sec) { if (sec) io.observe(sec); });
  }

  // Citation: copy the BibTeX entry.
  function mountCopy(card) {
    var button = el("button", null, "Copy"); button.type = "button";
    button.addEventListener("click", function () {
      var text = card.querySelector("pre").textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
        button.textContent = "Copied"; setTimeout(function () { button.textContent = "Copy"; }, 1600);
      }, function () { button.textContent = "Select and copy"; });
    });
    card.querySelector(".code-head").appendChild(button);
  }

  mountResults();
  mountScrollspy();
  var bib = document.getElementById("bibtex");
  if (bib) mountCopy(bib);
  var strip = document.getElementById("strip");
  if (strip) mountStrip(strip);
  var episode = document.getElementById("repair-player");
  if (episode) mountEpisode(episode, EPISODE);
  document.querySelectorAll(".tabbed").forEach(mountTabs);
  mountLightbox();
  if (!document.getElementById("results-table") && location.hash === "#results") location.replace("index.html#results");
})();
