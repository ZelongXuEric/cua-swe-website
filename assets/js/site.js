/* CUA-SWE: retained episode evidence and final-report success rates. */
(function () {
  "use strict";
  var LINKS = {
    paper: null,
    code: "https://github.com/kingofspace0wzz/cua-swe",
    viewer: "https://kingofspace0wzz.github.io/cua-swe-viewer/"
  };
  document.querySelectorAll("a[data-link]").forEach(function (a) {
    var url = LINKS[a.getAttribute("data-link")];
    if (url) a.href = url;
    else a.remove();
  });
  // Sources: paper/figure2_assets/cases/01_vector_relay; no synthetic screenshots.
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

  var TABLE1 = {
    domains: [["web", "Web", 36], ["game", "Game", 29], ["devops", "DevOps", 20], ["mobile", "Mobile", 20]],
    rows: [
      { m: "GPT-6 Astra",          web: [27.8, 66.7], game: [17.2, 37.9], devops: [0.0, 80.0], mobile: [0.0, 55.0] },
      { m: "GPT-5.6 Sol",          web: [19.4, 58.3], game: [10.3, 10.3], devops: [0.0, 55.0], mobile: [0.0, 45.0] },
      { m: "GPT-5.6 Luna",         web: [11.1, 5.6],  game: [0.0, 6.9],   devops: [0.0, 15.0], mobile: [0.0, 35.0] },
      { m: "GPT-5.6 Terra",        web: [11.1, 13.9], game: [3.4, 6.9],   devops: [0.0, 25.0], mobile: [0.0, 35.0] },
      { m: "Claude Opus 5",        web: [22.2, 55.6], game: [13.8, 20.7], devops: [0.0, 60.0], mobile: [null, null] },
      { m: "Claude Opus 4.8",      web: [16.7, 27.8], game: [3.4, 20.7],  devops: [0.0, 55.0], mobile: [0.0, 40.0] },
      { m: "Claude Sonnet 5",      web: [8.3, 0.0],   game: [6.9, 3.4],   devops: [0.0, 40.0], mobile: [0.0, 35.0] },
      { m: "Claude Fable 5",       web: [19.4, 47.2], game: [13.8, 17.2], devops: [5.0, 55.0], mobile: [5.0, 40.0] },
      { m: "Grok 4.6",             web: [30.6, 55.6], game: [10.3, 17.2], devops: [0.0, 65.0], mobile: [0.0, 30.0] },
      { m: "Codex + GPT-5.6 Sol",  sys: true, web: [null, 55.6], game: [null, 17.2], devops: [null, 55.0], mobile: [null, 40.0] },
      { m: "Claude Code + Opus 5", sys: true, web: [null, 55.6], game: [null, 20.7], devops: [null, 65.0], mobile: [null, null] }
    ]
  };

  // Values above are the original pass@1 results in
  // paper/evaluation/final-evaluation-report.md (2026-09-24).
  // Game pass@3 uses reviewed replacement attempts and is a separate cohort.
  var NOTES = {
    web: "Web success requires a passing patch and the required visual evidence. Rule exclusions remain in the 36-task denominator.",
    game: "Original Game pass@1 results. The separate pass@3 evaluation uses reviewed runtime replacements for some first attempts.",
    devops: "Valid records must follow the tool-use rules. Reviewed infrastructure errors receive replacements; genuine agent failures count as failures.",
    mobile: "Opus 5 API and Claude Code evaluations are deferred. Deferred means no score, not zero success."
  };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderScreen(step) {
    var s = step.screen, frag = document.createDocumentFragment(), media = el("div", "media");
    if (s.type === "image") {
      var img = el("img"); img.src = s.src; img.alt = s.alt; img.width = 1280; img.height = 720;
      media.appendChild(img);
    } else {
      var pane = el("div", "pane");
      if (s.type === "diff") {
        s.files.forEach(function (file) {
          pane.appendChild(el("div", "hdr", file.name));
          var pre = el("pre");
          file.lines.forEach(function (line) { pre.appendChild(el("span", line[0], line[1] + "\n")); });
          pane.appendChild(pre);
        });
      } else if (s.type === "shell") {
        s.items.forEach(function (item) {
          var pre = el("pre");
          pre.appendChild(el("span", "cmd", "$ " + item.cmd + "\n"));
          pre.appendChild(el("span", item.ok ? "ok" : "out", item.out + "\n"));
          pane.appendChild(pre);
        });
      } else if (s.type === "verify") {
        s.checks.forEach(function (check) {
          var pre = el("pre");
          pre.appendChild(el("span", "hdr", check.name + ": " + check.cmd + "\n"));
          pre.appendChild(el("span", "out", check.result + "\n"));
          pre.appendChild(el("span", check.pass ? "ok" : "fail", check.pass ? "passed\n" : "failed\n"));
          pane.appendChild(pre);
        });
        pane.appendChild(el("pre", "ok", s.summary));
      }
      media.appendChild(pane);
    }
    frag.appendChild(media);
    frag.appendChild(el("div", "note", s.caption));
    return frag;
  }

  function mountEpisode(root) {
    var screen = root.querySelector(".screen"), list = root.querySelector(".steps"), buttons = [];
    var titles = ["Observe the failure", "Repair the ownership logic", "Check the code", "Replay in the running game", "Verify on a clean copy"];
    var details = [
      "The return fractures. The relay stays armed and the score stays at zero.",
      "Manual recall withdraws a pending return. Natural replacement transfers it to the new owner.",
      "Check recall, handoff and duplicate contacts in Node, then build.",
      "The rebuilt game completes the circuit: one sealed return and 500 points.",
      "The evaluator applies the patch to a fresh project. Protected build and browser checks pass."
    ];
    function show(index) {
      screen.replaceChildren(renderScreen(EPISODE.steps[index]));
      screen.setAttribute("aria-label", "Step " + (index + 1) + ": " + titles[index]);
      buttons.forEach(function (button, i) { button.setAttribute("aria-pressed", String(i === index)); });
    }
    EPISODE.steps.forEach(function (step, i) {
      var li = el("li"), button = el("button");
      button.type = "button"; button.setAttribute("aria-controls", "episode-screen");
      button.appendChild(el("span", "step-number", String(i + 1).padStart(2, "0")));
      var body = el("span"); body.appendChild(el("span", "t", titles[i])); body.appendChild(el("span", "d", details[i]));
      button.appendChild(body); li.appendChild(button); list.appendChild(li); buttons.push(button);
      button.addEventListener("click", function () { show(i); });
      button.addEventListener("keydown", function (event) {
        var target = i;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") target = (i + 1) % buttons.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = (i + buttons.length - 1) % buttons.length;
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = buttons.length - 1;
        else return;
        event.preventDefault(); buttons[target].focus(); show(target);
      });
    });
    show(0);
  }

  function renderResults(domain) {
    var meta = TABLE1.domains.find(function (d) { return d[0] === domain; });
    var host = document.getElementById("results-table"), table = el("table", "score-table");
    table.appendChild(el("caption", null, meta[1] + ": " + meta[2] + " tasks. Pass@1 success (%). CUA adds computer-use tools."));
    var head = el("thead"), labels = el("tr");
    [["Model / agent", ""], ["", "chart-head"], ["Code-only", "code-head"], ["CUA", "cua-head"]].forEach(function (entry) {
      var th = el("th", entry[1], entry[0]); th.scope = "col";
      if (!entry[0]) {
        th.setAttribute("aria-label", "Comparison of success rates, from zero to 100 percent");
        var scale = el("div", "chart-scale"); scale.setAttribute("aria-hidden", "true");
        scale.appendChild(el("span", null, "0%")); scale.appendChild(el("span", null, "100%"));
        th.appendChild(scale);
      }
      labels.appendChild(th);
    });
    head.appendChild(labels); table.appendChild(head);
    var body = el("tbody");
    var max = Math.max.apply(null, TABLE1.rows.map(function (r) { return r[domain][1] == null ? -1 : r[domain][1]; }));
    TABLE1.rows.forEach(function (row, index) {
      var values = row[domain], tr = el("tr", row.sys && !TABLE1.rows[index - 1].sys ? "system-start" : "");
      var model = el("th", null, row.m); model.scope = "row"; tr.appendChild(model);
      var graphic = el("td", "rail-cell"); graphic.setAttribute("aria-hidden", "true");
      if (values[1] != null) {
        var rail = el("div", "rail");
        rail.style.setProperty("--cua-value", values[1] + "%");
        if (values[0] != null) {
          rail.style.setProperty("--code-value", values[0] + "%");
          rail.style.setProperty("--start", Math.min(values[0], values[1]) + "%");
          rail.style.setProperty("--length", Math.abs(values[1] - values[0]) + "%");
          rail.appendChild(el("span", "range")); rail.appendChild(el("span", "point code"));
        }
        rail.appendChild(el("span", "point cua")); graphic.appendChild(rail);
      }
      tr.appendChild(graphic);
      values.forEach(function (value, i) {
        var td = el("td", "value" + (i === 1 ? " cua" : "") + (i === 1 && value === max ? " best" : ""));
        if (value == null) {
          var deferred = domain === "mobile" && (row.m === "Claude Opus 5" || (row.m === "Claude Code + Opus 5" && i === 1));
          td.textContent = deferred ? "Deferred" : "—";
          td.setAttribute("aria-label", deferred ? "Evaluation deferred" : "Not evaluated");
        } else {
          td.textContent = value.toFixed(1);
          var count = Math.round(value * meta[2] / 100);
          td.title = count + " / " + meta[2] + " tasks";
          td.setAttribute("aria-label", count + " of " + meta[2] + " tasks, " + value.toFixed(1) + " percent");
        }
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    table.appendChild(body); host.replaceChildren(table);
    document.getElementById("results-note").textContent = NOTES[domain];
  }

  function mountVideo(video) {
    var toggle = document.getElementById("video-toggle");
    function reflectState() {
      toggle.textContent = video.paused ? "Play" : "Pause";
      toggle.setAttribute("aria-label", (video.paused ? "Play" : "Pause") + " overview video");
    }
    function play() { var promise = video.play(); if (promise) promise.catch(reflectState); }
    if (reduced.matches) { video.removeAttribute("autoplay"); video.pause(); }
    toggle.addEventListener("click", function () { if (video.paused) play(); else video.pause(); });
    video.addEventListener("play", reflectState); video.addEventListener("pause", reflectState);
    reduced.addEventListener("change", function (event) { if (event.matches) video.pause(); });
    document.getElementById("video-expand").addEventListener("click", function () {
      video.controls = true;
      if (video.requestFullscreen) video.requestFullscreen().catch(function () {});
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      play();
    });
    document.addEventListener("fullscreenchange", function () { video.controls = document.fullscreenElement === video; });
    reflectState();
  }

  var header = document.querySelector(".site-header");
  function updateHeader() { header.classList.toggle("scrolled", window.scrollY > 8); }
  updateHeader(); window.addEventListener("scroll", updateHeader, { passive: true });
  var episode = document.getElementById("repair-player");
  var video = document.getElementById("demo-video");
  if (episode) mountEpisode(episode);
  if (video) mountVideo(video);
  document.querySelectorAll("[data-result-domain]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-result-domain]").forEach(function (other) { other.setAttribute("aria-pressed", String(other === button)); });
      renderResults(button.getAttribute("data-result-domain"));
    });
  });
  if (document.getElementById("results-table")) renderResults("web");
  else if (location.hash === "#results") location.replace("results.html");
})();
