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
    DOMAINS.forEach(function (d) {
      var el = document.querySelector('[data-chart="' + d[0] + '"]'); if (!el) return;
      var rows = TABLE1.map(function (r) { return { m: r.m, code: r[d[0]][0], cua: r[d[0]][1], n: d[2], deferred: r.deferredMobile && d[0] === "mobile" }; });
      drawGrouped(el, rows, { w: 520, h: 274, bw: 16, fs: 9.5, padB: 88, label: d[1] + " task success, Code-only and Hybrid" });
      var cap = document.createElement("div"); cap.className = "chart-title"; cap.textContent = d[1] + " (" + d[2] + " tasks)";
      el.insertBefore(cap, el.firstChild);
    });
    var table = document.getElementById("results-table");
    if (table) renderTable(table);
  }

  // Recorded runs. Every screenshot, patch excerpt, shell output and verifier result is retained evidence
  // from the named attempt; nothing is reconstructed. Sources are listed in assets/media/manifest.json.
  var EPISODES = [
    { tab: "Web: Fabric.js editor",
      title: "Web: Fabric.js artboard editor, GPT-6 Astra with Hybrid access",
      task: "The instruction reads: \u201cThe Blue shape does not behave as described in Help. Repair the editor while preserving its existing interactions.\u201d It does not say what is wrong. The expected behavior is written in the Help panel of the running application.",
      taskId: "web.fabric-nested-selection-05.001",
      foot: "Screenshots, both edits and the verifier report come from this attempt, recorded on 20 September 2026. In the Web evaluation, 1 of 9 API models solved this task with Hybrid access and 0 of 9 with Code-only.",
      steps: [
        { title: "Read Help in the application, then the source", detail: "Help says a side or corner handle may pass through the opposite edge and keep going. In src/app.mjs the agent finds the resize clamped at one pixel, so Blue can never cross.",
          screen: { type: "image", src: "assets/media/fabric-nested-selection/frame-02.png", w: 1000, h: 780,
                    alt: "Artboard Editor with the Help panel opened below the canvas; the Blue rectangle sits inside two nested gray frames",
                    caption: "Screenshot 2 of 19, 23:03:31 UTC, after opening Help" } },
        { title: "First edit: let a dragged edge cross the opposite one", detail: "The Math.max(1, \u2026) clamp is removed. Width and height stay signed for positioning and are stored as absolute values.",
          screen: { type: "diff", files: [
            { name: "src/app.mjs", lines: [
              ["ctx", "  const delta = p.subtract(start);"],
              ["del", "- const width = sx ? Math.max(1, edit.width+sx*(delta.x*u.x+delta.y*u.y)) : edit.width;"],
              ["del", "- const height = sy ? Math.max(1, edit.height+sy*(delta.x*v.x+delta.y*v.y)) : edit.height;"],
              ["del", "- rect.set({scaleX:width/edit.original.width, scaleY:height/edit.original.height});"],
              ["add", "+ const width = sx ? edit.width+sx*(delta.x*u.x+delta.y*u.y) : edit.width;"],
              ["add", "+ const height = sy ? edit.height+sy*(delta.x*v.x+delta.y*v.y) : edit.height;"],
              ["add", "+ rect.set({width:Math.abs(width), height:Math.abs(height), scaleX:1, scaleY:1});"] ] } ],
            caption: "Edit at 23:03:50 UTC, as it appears in the submitted patch; code comments omitted" } },
        { title: "Try it in the application: crossing works", detail: "After a reload the agent selects Blue and drags a side handle, then a corner, through the opposite edge. Blue now extends outside its frame, with its outline and handles in place.",
          screen: { type: "image", src: "assets/media/fabric-nested-selection/frame-06.png", w: 1000, h: 780,
                    alt: "Blue resized through its opposite corner; it now sits at the top-left edge of the inner frame with red handles around it",
                    caption: "Screenshot 6 of 19, 23:04:20 UTC, after the corner drag" } },
        { title: "Keep going: Blue no longer responds", detail: "The agent then drags Blue itself. It does not move and its handles are gone. The agent notes: \u201cTesting also exposed a related issue: after Blue crosses outside a fixed frame, Fabric no longer finds its visible fill.\u201d Help requires that a later fill drag moves the whole shape.",
          screen: { type: "image", src: "assets/media/fabric-nested-selection/frame-07.png", w: 1000, h: 780,
                    alt: "Blue in the same place outside the inner frame, now without any selection handles",
                    caption: "Screenshot 7 of 19, 23:04:26 UTC, after dragging on Blue\u2019s fill" } },
        { title: "Second edit: find artwork that overflows its frame", detail: "A canvas subclass extends the pointer hit test to the children of a frame, so a shape outside its frame can still be selected and dragged.",
          screen: { type: "diff", files: [
            { name: "src/app.mjs", lines: [
              ["add", "+ class ArtboardCanvas extends fabric.Canvas {"],
              ["add", "+   _checkTarget(object, pointer) {"],
              ["add", "+     return super._checkTarget(object, pointer) ||"],
              ["add", "+       !!(object.visible && object.evented && object instanceof fabric.Group &&"],
              ["add", "+         object.interactive && object.subTargetCheck &&"],
              ["add", "+         object.getObjects().some(child => this._checkTarget(child, pointer)));"],
              ["add", "+   }"],
              ["add", "+ }"],
              ["ctx", "  \u2026"],
              ["del", "- const canvas = new fabric.Canvas(canvasEl, {"],
              ["add", "+ const canvas = new ArtboardCanvas(canvasEl, {"] ] } ],
            caption: "Edit at 23:04:40 UTC, as it appears in the submitted patch; code comments omitted" } },
        { title: "Repeat the same drags", detail: "After another reload the agent crosses the frame again and drags Blue\u2019s fill. This time Blue moves and stays selected.",
          screen: { type: "image", src: "assets/media/fabric-nested-selection/frame-11.png", w: 1000, h: 780,
                    alt: "Blue moved back inside the inner frame by a fill drag, with its selection handles still shown",
                    caption: "Screenshot 11 of 19, 23:07:13 UTC, after dragging on Blue\u2019s fill" } },
        { title: "Verifier, on a clean copy", detail: "The evaluator rebuilds the project with the patch and replays scripted drags in a browser. All 21 checkpoints pass, including the three that drag Blue after it has crossed its frame.",
          screen: { type: "verify", checks: [
            { name: "build", cmd: "node build.mjs", result: "exit code 0", pass: true },
            { name: "ui", cmd: "python3 verifiers/browser_check.py",
              result: "nested-A-side-cross-released: PASS\nnested-A-corner-cross-released: PASS\nnested-A-fill-continuation-acquired: PASS\nnested-A-fill-continuation-preview: PASS\nnested-A-fill-continuation-released: PASS\n\u2026 21 of 21 checkpoints PASS", pass: true } ],
            summary: "success: true", caption: "Retained verifier report for the same attempt; five of the 21 checkpoint lines shown" } }
      ] },
    { tab: "Game: Vector Relay",
      title: "Game: Vector Relay, GPT-5.6 Sol with Hybrid access",
      task: "The player launches an orb at a relay; when the orb returns, the relay should clear and score. The task asks the agent to make a return count exactly once after the orb falls out and a replacement docks, and not at all after the player recalls the orb.",
      taskId: "gameqa.vector-relay-primed-pulse-balance-handoff.011",
      foot: "Screenshots, patch and verifier result come from this attempt. In the task\u2019s three matched trials, Code-only solved 0/3 and Hybrid solved 1/3.",
    steps: [
      { title: "See the bug in the running game", detail: "A replacement orb has docked, but the relay is still armed, the PULSE BALANCE panel marks the return as fractured and the score is 000000. The task requires this return to clear the relay and score.",
        screen: { type: "image", src: "assets/media/vector-relay-frame-03.png",
                  alt: "Vector Relay after launch: RELAY ARMED, PULSE BALANCE shows a fractured mark, score 000000, message ORB REPLACED",
                  caption: "Screenshot 3 of 16, 10:04:30 UTC, after pressing Space to launch" } },
      { title: "Change which orb a pending return belongs to", detail: "The patch adds two cases where an orb docks. On a manual recall it withdraws the pending return (withdraw). When a replacement docks it hands the return to the new orb (handoff), so it can still score.",
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
      { title: "Test the new logic from the shell", detail: "Two Node scripts exercise recall, handoff and duplicate contacts without the game; then the build runs.",
        screen: { type: "shell", items: [
          { cmd: "node -e '… lane.withdraw(recalled) … lane.handoff(natural, replacement) … lane.take(14, shifted)'", out: "{\"pending\":0,\"withdrawn\":1,\"dropped\":0,\"nextDue\":null}" },
          { cmd: "node -e '… contacts.claim(body, tile) twice …'", out: "{\"first\":true,\"sustained\":false,\"series\":0}" },
          { cmd: "npm run build", out: "node --check src/relay_contact.js && node --check src/relay_commit.js && … && node --check server.mjs", ok: true } ],
          caption: "Shell events 17, 19 and 20 of the recorded trajectory, abbreviated" } },
      { title: "Replay in the rebuilt game", detail: "After a reload the same play clears the relay: CIRCUIT COMPLETE, score 000500.",
        screen: { type: "image", src: "assets/media/vector-relay-frame-15.png",
                  alt: "Vector Relay after the repair: RELAY CLEARED, PULSE BALANCE shows a sealed mark, score 000500, message CIRCUIT COMPLETE +500",
                  caption: "Screenshot 15 of 16, 10:07:20 UTC, after reloading the rebuilt app and replaying" } },
      { title: "Verifier, on a clean copy", detail: "The evaluator applies the patch to a fresh project, rebuilds it and replays the challenge in a browser: score 500, one recall, pass.",
        screen: { type: "verify", checks: [
          { name: "build", cmd: "npm run build", result: "exit code 0", pass: true },
          { name: "state", cmd: "verifiers/browser_check.py --url http://127.0.0.1:53500/?challenge=relay-circuit",
            result: "{\"status\": \"pass\", \"score\": 500, \"routes\": 1, \"browser_actions\": 4, \"recalls\": 1}", pass: true } ],
          summary: "success: true", caption: "Retained verifier report for the same attempt" } }
    ] }
  ];
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function renderScreen(step) {
    var s = step.screen, frag = document.createDocumentFragment(), media = el("div", "media");
    if (s.type === "image") {
      var img = el("img"); img.src = s.src; img.alt = s.alt; img.width = s.w || 1280; img.height = s.h || 720; media.appendChild(img);
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
    var screen = root.querySelector(".screen"), list = root.querySelector(".steps"), tabs = document.getElementById("episode-tabs");
    var title = document.getElementById("episode-title"), task = document.getElementById("episode-task"), foot = root.querySelector(".episode-foot");
    var episode, buttons = [], tabButtons = [];
    function show(index) {
      screen.replaceChildren(renderScreen(episode.steps[index]));
      screen.setAttribute("aria-label", "Step " + (index + 1) + ": " + episode.steps[index].title);
      buttons.forEach(function (button, i) { button.setAttribute("aria-pressed", String(i === index)); });
    }
    function load(which) {
      episode = EPISODES[which]; buttons = [];
      tabButtons.forEach(function (button, i) { button.setAttribute("aria-pressed", String(i === which)); });
      title.textContent = episode.title;
      task.textContent = episode.task + " ";
      var link = el("a", null, "Full instruction"); link.href = "tasks.html#" + episode.taskId; task.appendChild(link);
      foot.textContent = episode.foot;
      list.replaceChildren();
      episode.steps.forEach(function (step, i) {
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
    EPISODES.forEach(function (entry, i) {
      var button = el("button", null, entry.tab); button.type = "button";
      button.addEventListener("click", function () { load(i); });
      tabs.appendChild(button); tabButtons.push(button);
    });
    load(0);
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
