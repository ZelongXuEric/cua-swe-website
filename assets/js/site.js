/* CUA-SWE: results charts and table from the final evaluation report, plus the retained episode evidence. */
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
  // Panel a: Figure 3a of the paper. Four-domain mean on matched tasks within each model and domain,
  // eight API models (Opus 5 is deferred on Mobile). Values are transcribed from the figure.
  var MEAN = [
    { m: "GPT-6 Astra", code: 11.3, cua: 59.3 }, { m: "Fable 5", code: 12.7, cua: 45.5 },
    { m: "Grok 4.6", code: 10.2, cua: 43.8 }, { m: "GPT-5.6 Sol", code: 7.4, cua: 42.8 },
    { m: "Opus 4.8", code: 5.0, cua: 34.2 }, { m: "GPT-5.6 Terra", code: 3.6, cua: 20.7 },
    { m: "Sonnet 5", code: 3.8, cua: 17.1 }, { m: "GPT-5.6 Luna", code: 2.8, cua: 16.1 }
  ];
  // Panel c: complete scored Hybrid cohorts (Figure 1b), the four reported domain rates weighted equally.
  function fourDomainMean(row, i) {
    var vals = DOMAINS.map(function (d) { return row[d[0]][i]; });
    if (vals.some(function (v) { return v == null; })) return null;
    return Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length * 10) / 10;
  }
  // Execution profile (paper Figure 3b): agent minutes per success and Hybrid steps per task.
  var PROFILE = {
    "GPT-6 Astra": [7.2, 46.3], "Fable 5": [33.1, 51.1], "Grok 4.6": [32.2, 56.7], "GPT-5.6 Sol": [8.7, 37.7],
    "Opus 4.8": [24.5, 54.5], "GPT-5.6 Terra": [11.8, 23.9], "Sonnet 5": [60.9, 69.4], "GPT-5.6 Luna": [14.6, 27.9]
  };
  var LABEL_SIDE = { "Fable 5": "above", "Grok 4.6": "left", "Sonnet 5": "left", "Opus 4.8": "right" };
  var EFFICIENCY = TABLE1.filter(function (r) { return PROFILE[r.m] && fourDomainMean(r, 1) != null; })
    .map(function (r) { return { m: r.m, success: fourDomainMean(r, 1), minutes: PROFILE[r.m][0], steps: PROFILE[r.m][1] }; });

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

  // Scatter: Hybrid success against agent minutes per success (log scale).
  function drawScatter(el, rows) {
    var W = 440, H = 300, padL = 40, padR = 14, padT = 14, padB = 44, innerW = W - padL - padR, innerH = H - padT - padB;
    var xmin = Math.log(5), xmax = Math.log(80), ymax = 70;
    function X(v) { return padL + (Math.log(v) - xmin) / (xmax - xmin) * innerW; }
    function Y(v) { return padT + innerH - v / ymax * innerH; }
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Hybrid task success against agent minutes per success">'];
    [0, 10, 20, 30, 40, 50, 60, 70].forEach(function (v) {
      s.push('<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#e6e6e6"/>');
      s.push('<text x="' + (padL - 6) + '" y="' + (Y(v) + 3.5) + '" text-anchor="end" font-size="10" fill="#666">' + v + '</text>');
    });
    [5, 10, 20, 40, 80].forEach(function (v) {
      s.push('<line y1="' + padT + '" y2="' + (padT + innerH) + '" x1="' + X(v) + '" x2="' + X(v) + '" stroke="#f0f0f0"/>');
      s.push('<text x="' + X(v) + '" y="' + (padT + innerH + 14) + '" text-anchor="middle" font-size="10" fill="#666">' + v + '</text>');
    });
    s.push('<text x="' + (padL + innerW / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="#444">Agent minutes per success (log scale)</text>');
    s.push('<text transform="translate(11,' + (padT + innerH / 2) + ') rotate(-90)" text-anchor="middle" font-size="11" fill="#444">Hybrid task success (%)</text>');
    rows.forEach(function (r) {
      var x = X(r.minutes), y = Y(r.success), color = COLOR[r.m] || "#888";
      var side = LABEL_SIDE[r.m] || "right", tx = x, ty = y + 3.5, anchor = "start";
      if (side === "right") tx = x + 9; else if (side === "left") { tx = x - 9; anchor = "end"; }
      else if (side === "above") { ty = y - 9; anchor = "middle"; } else if (side === "below") { ty = y + 16; anchor = "middle"; }
      s.push('<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + color + '"><title>' + esc(r.m + ": " + r.success.toFixed(1) + "% success, " + r.minutes.toFixed(1) + " agent minutes per success, " + r.steps.toFixed(1) + " steps per task") + '</title></circle>');
      s.push('<text x="' + tx + '" y="' + ty + '" text-anchor="' + anchor + '" font-size="10.5" fill="#222">' + esc(r.m) + '</text>');
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

  function mountResults() {
    var mean = document.getElementById("chart-mean");
    if (mean) drawGrouped(mean, MEAN, { w: 640, h: 300, bw: 26, gain: true, fs: 11, label: "Four-domain mean task success, Code-only and Hybrid, eight API models" });
    var eff = document.getElementById("chart-eff");
    if (eff) drawScatter(eff, EFFICIENCY);
    DOMAINS.forEach(function (d) {
      var el = document.querySelector('[data-chart="' + d[0] + '"]'); if (!el) return;
      var rows = TABLE1.map(function (r) { return { m: r.m, code: r[d[0]][0], cua: r[d[0]][1], n: d[2], deferred: r.deferredMobile && d[0] === "mobile" }; });
      drawGrouped(el, rows, { w: 520, h: 250, bw: 16, fs: 9.5, padB: 64, label: d[1] + " task success, Code-only and Hybrid" });
      var cap = document.createElement("div"); cap.className = "chart-title"; cap.textContent = d[1] + " (" + d[2] + " tasks)";
      el.insertBefore(cap, el.firstChild);
    });
    var table = document.getElementById("results-table");
    if (table) renderTable(table);
  }

  // Sources: paper/figure2_assets/cases/01_vector_relay; no synthetic screenshots.
  var EPISODE = {
    steps: [
      { title: "Observe the failure", detail: "The return fractures. The relay stays armed and the score stays at zero.",
        screen: { type: "image", src: "assets/media/vector-relay-frame-03.png",
                  alt: "Vector Relay after launch: RELAY ARMED, PULSE BALANCE shows a fractured mark, score 000000, message ORB REPLACED",
                  caption: "Screenshot 3 of 16, 10:04:30 UTC, after pressing Space to launch" } },
      { title: "Repair the ownership logic", detail: "Manual recall withdraws a pending return. Natural replacement transfers it to the new owner.",
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
            ["ctx", "  };"] ] },
          { name: "src/relay_commit.js", lines: [
            ["add", "+ RelayLane.prototype.withdraw = function (owner) {"],
            ["add", "+   … drop pending entries owned by the recalled orb"],
            ["add", "+ };"],
            ["add", "+ RelayLane.prototype.handoff = function (fromOwner, toOwner) {"],
            ["add", "+   … move pending entries to the replacement owner"],
            ["add", "+ };"] ] } ],
          caption: "Retained agent patch, excerpted; the full diff changes 2 files" } },
      { title: "Check the code", detail: "Check recall, handoff and duplicate contacts in Node, then build.",
        screen: { type: "shell", items: [
          { cmd: "node -e '… lane.withdraw(recalled) … lane.handoff(natural, replacement) … lane.take(14, shifted)'", out: "{\"pending\":0,\"withdrawn\":1,\"dropped\":0,\"nextDue\":null}" },
          { cmd: "node -e '… contacts.claim(body, tile) twice …'", out: "{\"first\":true,\"sustained\":false,\"series\":0}" },
          { cmd: "npm run build", out: "node --check src/relay_contact.js && node --check src/relay_commit.js && … && node --check server.mjs", ok: true } ],
          caption: "Shell events 17, 19 and 20 of the recorded trajectory, abbreviated" } },
      { title: "Replay in the running game", detail: "The rebuilt game completes the circuit: one sealed return and 500 points.",
        screen: { type: "image", src: "assets/media/vector-relay-frame-15.png",
                  alt: "Vector Relay after the repair: RELAY CLEARED, PULSE BALANCE shows a sealed mark, score 000500, message CIRCUIT COMPLETE +500",
                  caption: "Screenshot 15 of 16, 10:07:20 UTC, after reloading the rebuilt app and replaying" } },
      { title: "Verify on a clean copy", detail: "The evaluator applies the patch to a fresh project. Protected build and browser checks pass.",
        screen: { type: "verify", checks: [
          { name: "build", cmd: "npm run build", result: "exit code 0", pass: true },
          { name: "state", cmd: "verifiers/browser_check.py --url http://127.0.0.1:53500/?challenge=relay-circuit",
            result: "{\"status\": \"pass\", \"score\": 500, \"routes\": 1, \"browser_actions\": 4, \"recalls\": 1}", pass: true } ],
          summary: "success: true", caption: "Retained verifier report for the same attempt" } }
    ]
  };
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function renderScreen(step) {
    var s = step.screen, frag = document.createDocumentFragment(), media = el("div", "media");
    if (s.type === "image") {
      var img = el("img"); img.src = s.src; img.alt = s.alt; img.width = 1280; img.height = 720; media.appendChild(img);
    } else {
      var pane = el("div", "pane");
      if (s.type === "diff") {
        s.files.forEach(function (file) {
          pane.appendChild(el("div", "hdr", file.name));
          var pre = el("pre"); file.lines.forEach(function (line) { pre.appendChild(el("span", line[0], line[1] + "\n")); }); pane.appendChild(pre);
        });
      } else if (s.type === "shell") {
        s.items.forEach(function (item) {
          var pre = el("pre"); pre.appendChild(el("span", "cmd", "$ " + item.cmd + "\n")); pre.appendChild(el("span", item.ok ? "ok" : "out", item.out + "\n")); pane.appendChild(pre);
        });
      } else if (s.type === "verify") {
        s.checks.forEach(function (check) {
          var pre = el("pre"); pre.appendChild(el("span", "hdr", check.name + ": " + check.cmd + "\n")); pre.appendChild(el("span", "out", check.result + "\n"));
          pre.appendChild(el("span", check.pass ? "ok" : "fail", check.pass ? "passed\n" : "failed\n")); pane.appendChild(pre);
        });
        pane.appendChild(el("pre", "ok", s.summary));
      }
      media.appendChild(pane);
    }
    frag.appendChild(media); frag.appendChild(el("div", "note", s.caption)); return frag;
  }
  function mountEpisode(root) {
    var screen = root.querySelector(".screen"), list = root.querySelector(".steps"), buttons = [];
    function show(index) {
      screen.replaceChildren(renderScreen(EPISODE.steps[index]));
      screen.setAttribute("aria-label", "Step " + (index + 1) + ": " + EPISODE.steps[index].title);
      buttons.forEach(function (button, i) { button.setAttribute("aria-pressed", String(i === index)); });
    }
    EPISODE.steps.forEach(function (step, i) {
      var li = el("li"), button = el("button"); button.type = "button"; button.setAttribute("aria-controls", "episode-screen");
      button.appendChild(el("span", "step-number", String(i + 1).padStart(2, "0")));
      var body = el("span"); body.appendChild(el("span", "t", step.title)); body.appendChild(el("span", "d", step.detail));
      button.appendChild(body); li.appendChild(button); list.appendChild(li); buttons.push(button);
      button.addEventListener("click", function () { show(i); });
      button.addEventListener("keydown", function (event) {
        var target = i;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") target = (i + 1) % buttons.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = (i + buttons.length - 1) % buttons.length;
        else if (event.key === "Home") target = 0; else if (event.key === "End") target = buttons.length - 1; else return;
        event.preventDefault(); buttons[target].focus(); show(target);
      });
    });
    show(0);
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

  mountResults();
  var episode = document.getElementById("repair-player");
  if (episode) mountEpisode(episode);
  mountLightbox();
  if (!document.getElementById("results-table") && location.hash === "#results") location.replace("index.html#results");
})();
