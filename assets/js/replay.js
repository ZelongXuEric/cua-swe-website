/* CUA-SWE: timed replay of one recorded agent episode.
   Text appears as true prefixes of the record; frames switch only after their action is shown. */
(function () {
  "use strict";

  // ---- Pure timeline, exported for tools/check_replay.mjs ----
  function clamp(value, lo, hi) { return Math.round(Math.min(hi, Math.max(lo, value))); }
  function streams(kind) { return kind === "agent_message" || kind === "plan" || kind === "command" || kind === "insight"; }
  // Reveal time grows sublinearly with length; a separate hold leaves time to read.
  function pace(n, kind) {
    if (kind === "agent_message" || kind === "plan") return { reveal: clamp(700 + 2.6 * Math.pow(n, 0.94), 900, 6000), hold: clamp(600 + 0.5 * n, 900, 2000) };
    if (kind === "command") return { reveal: clamp(400 + 1.2 * Math.pow(n, 0.9), 500, 1800), hold: 350 };
    if (kind === "insight") return { reveal: clamp(300 + 1.5 * n, 500, 1200), hold: 1200 };
    if (kind === "stage") return { reveal: 0, hold: 300 };
    if (kind === "verify") return { reveal: 0, hold: 2600 };
    return { reveal: 0, hold: kind === "computer_use" ? 750 : 650 };
  }
  function abridge(text) {
    var cut = text.split("\n").slice(0, 6).join("\n");
    if (cut.length > 480) cut = cut.slice(0, 480);
    return { text: cut, more: cut.length < text.length };
  }
  function display(e) {
    if (e.kind !== "command") return e.text;
    var out = abridge(e.text);
    return "$ " + e.title + (out.text ? "\n" + out.text + (out.more ? "\n…" : "") : "");
  }
  function makeTimeline(ep) {
    var t = 0, segs = [];
    function add(seg, kind) {
      var p = pace(seg.text.length, kind);
      seg.start = t; seg.reveal = streams(kind) ? p.reveal : 0; seg.end = t + seg.reveal + p.hold;
      t = seg.end; segs.push(seg);
    }
    ep.stages.forEach(function (stage, s) {
      add({ type: "stage", stage: s, text: "" }, "stage");
      ep.events.forEach(function (e, i) {
        if (e.seq >= stage.from && e.seq <= stage.to) add({ type: "event", stage: s, index: i, text: display(e) }, e.kind);
      });
      add({ type: "insight", stage: s, text: stage.insight }, "insight");
    });
    add({ type: "verify", stage: ep.stages.length - 1, text: "" }, "verify");
    return { segs: segs, duration: t };
  }
  function shownLength(seg, pos, reduced) {
    if (reduced || pos >= seg.start + seg.reveal) return seg.text.length;
    if (pos <= seg.start) return 0;
    var n = Math.floor(seg.text.length * Math.floor((pos - seg.start) / 24) * 24 / seg.reveal);
    var code = seg.text.charCodeAt(n - 1);
    return code >= 0xd800 && code <= 0xdbff ? n - 1 : n;
  }
  function snapshot(ep, tl, pos) {
    var visible = 0, frame = -1, stagesDone = 0;
    tl.segs.forEach(function (seg) {
      if (seg.start > pos) return;
      visible++;
      if (seg.type === "event" && pos >= seg.start + seg.reveal && ep.events[seg.index].frame != null) frame = ep.events[seg.index].frame;
      if (seg.type === "insight" && pos >= seg.start + seg.reveal) stagesDone = seg.stage + 1;
    });
    return { visible: visible, frame: frame, stagesDone: stagesDone,
             stage: visible ? tl.segs[visible - 1].stage : 0, done: pos >= tl.duration };
  }
  function stageEnd(tl, s) {
    var seg = tl.segs.filter(function (x) { return x.type === "insight" && x.stage === s; })[0];
    return seg.end - 1;
  }

  // ---- Rendering ----
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function describe(e) {
    if (e.title === "visual_cua.start") return "Open the game in the browser";
    if (e.title === "visual_cua.observe") return "Take a screenshot";
    var a;
    try { a = JSON.parse(e.text.split("\n")[0]); } catch (error) { return e.text; }
    if (a.kind === "click") return "Click (" + a.x + ", " + a.y + ")";
    if (a.kind === "wait") return "Wait " + a.duration_ms + " ms";
    if (a.kind === "press") return "Press " + a.text;
    if (a.kind === "type") return "Type “" + a.text + "”";
    return a.kind;
  }

  function mount(root, ep) {
    var tl = makeTimeline(ep), reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    var st = { pos: 0, playing: false, speed: 1, loop: true, visible: false, manual: false,
               shown: 0, full: 0, frame: -2, stage: -1, raf: 0, last: 0, loopTimer: 0, nodes: [], preloaded: false };

    // Header, instruction and run facts.
    var head = el("header", "rp-head");
    head.appendChild(el("p", "rp-kicker", ep.kicker));
    head.appendChild(el("h3", null, ep.title));
    head.appendChild(el("p", "rp-summary", ep.summary));
    root.appendChild(head);
    var task = el("div", "rp-task"), instruction = el("p", "rp-instruction"), at = ep.instruction.indexOf(ep.highlight);
    task.appendChild(el("span", "rp-label", "Task instruction"));
    if (at < 0) instruction.textContent = ep.instruction;
    else {
      instruction.appendChild(document.createTextNode(ep.instruction.slice(0, at)));
      instruction.appendChild(el("mark", null, ep.highlight));
      instruction.appendChild(document.createTextNode(ep.instruction.slice(at + ep.highlight.length)));
    }
    task.appendChild(instruction);
    task.appendChild(el("p", "rp-run", ep.run.model.replace("gpt-", "GPT-").replace("-sol", " Sol") + " · construction trial " + ep.run.label +
      " · code-only " + ep.run.code[0] + "/" + ep.run.code[1] + " · with computer use " + ep.run.cua[0] + "/" + ep.run.cua[1]));
    root.appendChild(task);

    var nav = el("ol", "rp-stages"), stageButtons = [];
    nav.setAttribute("aria-label", "Replay stages");
    ep.stages.forEach(function (stage, i) {
      var li = el("li"), b = el("button");
      b.type = "button";
      b.appendChild(el("span", "n", pad(i + 1)));
      b.appendChild(el("span", "t", stage.title));
      b.addEventListener("click", function () { seek(stageEnd(tl, i)); });
      b.addEventListener("keydown", function (event) {
        var to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: ep.stages.length - 1 }[event.key];
        if (to == null) return;
        event.preventDefault(); to = (to + ep.stages.length) % ep.stages.length;
        stageButtons[to].focus(); seek(stageEnd(tl, to));
      });
      li.appendChild(b); nav.appendChild(li); stageButtons.push(b);
    });
    root.appendChild(nav);

    // Stream of record entries and the recorded browser.
    var grid = el("div", "rp-grid"), col = el("section", "rp-col"), stream = el("div", "rp-stream");
    col.setAttribute("aria-label", "Agent and environment record");
    var colHead = el("div", "rp-col-head");
    colHead.appendChild(el("span", null, "Agent ↔ Environment"));
    var badge = el("span", "rp-status", "Ready");
    colHead.appendChild(badge);
    stream.tabIndex = 0;
    stream.setAttribute("role", "region");
    stream.setAttribute("aria-label", "Recorded agent actions and outputs. Scroll to read earlier entries.");
    var reading = el("div", "rp-reading"), resume = el("button", null, "Resume replay");
    reading.hidden = true; resume.type = "button";
    reading.appendChild(el("span", null, "Paused for reading"));
    reading.appendChild(resume);
    col.appendChild(colHead); col.appendChild(stream); col.appendChild(reading);

    var browser = el("aside", "rp-browser"), bar = el("div", "rp-bar"), view = el("div", "rp-view");
    browser.setAttribute("aria-label", "Recorded browser frames");
    var img = el("img"), empty = el("p", "rp-empty", "The browser opens when the agent starts it."), marker = el("span", "rp-marker"), keycap = el("span", "rp-key");
    img.width = 1280; img.height = 720; img.alt = ""; img.hidden = true; marker.hidden = true; keycap.hidden = true;
    var open = el("a");
    open.target = "_blank"; open.rel = "noopener"; open.title = "Open the full-size frame";
    open.appendChild(img);
    view.appendChild(open); view.appendChild(marker); view.appendChild(keycap); view.appendChild(empty);
    browser.appendChild(bar); browser.appendChild(view);
    browser.appendChild(el("p", "rp-frame-note", "Recorded frames from this attempt. Markers show the recorded input position. Select a frame to open it full size."));
    grid.appendChild(col); grid.appendChild(browser);
    root.appendChild(grid);

    // Controls.
    var controls = el("div", "rp-controls");
    function button(label, text, cls) { var b = el("button", cls || "rp-btn", text); b.type = "button"; b.setAttribute("aria-label", label); controls.appendChild(b); return b; }
    var playBtn = button("Play replay", "▶ Play", "rp-play"), prevBtn = button("Previous stage", "←"), nextBtn = button("Next stage", "→"), againBtn = button("Replay from start", "↺ Replay");
    var loopLabel = el("label", "rp-opt"), loopBox = el("input");
    loopBox.type = "checkbox"; loopBox.checked = true;
    loopLabel.appendChild(loopBox); loopLabel.appendChild(document.createTextNode(" Loop"));
    controls.appendChild(loopLabel);
    var position = el("span", "rp-pos");
    controls.appendChild(position);
    var speedLabel = el("label", "rp-opt rp-speed", "Speed "), speed = el("select");
    [0.5, 1, 1.5, 2].forEach(function (v) { var o = el("option", null, v + "×"); o.value = v; o.selected = v === 1; speed.appendChild(o); });
    speedLabel.appendChild(speed); controls.appendChild(speedLabel);
    controls.appendChild(el("span", "rp-disclosure", "Recorded replay · real frames · long outputs abridged"));
    root.appendChild(controls);
    var seekBar = el("input", "rp-seek");
    seekBar.type = "range"; seekBar.min = 0; seekBar.max = 1000; seekBar.value = 0;
    seekBar.setAttribute("aria-label", "Replay progress");
    root.appendChild(seekBar);
    var history = el("details", "rp-history"), summary = el("summary", null, "Full trajectory · " + ep.events.length + " recorded events");
    history.appendChild(summary); root.appendChild(history);
    var announcer = el("p", "sr-only");
    announcer.setAttribute("aria-live", "polite");
    root.appendChild(announcer);

    function makeNode(seg) {
      var noop = function () {};
      if (seg.type === "stage") {
        var mark = el("div", "rp-stage-mark");
        mark.appendChild(el("span", "n", pad(seg.stage + 1)));
        mark.appendChild(el("span", null, ep.stages[seg.stage].title));
        return { el: mark, fill: noop };
      }
      if (seg.type === "insight") {
        var p = el("p", "rp-insight"), s = el("span");
        p.appendChild(el("span", "rp-tag", "Summary")); p.appendChild(s);
        return { el: p, fill: function (n) { s.textContent = seg.text.slice(0, n); } };
      }
      if (seg.type === "verify") return { el: verifyCard(), fill: noop };
      var e = ep.events[seg.index];
      if (e.kind === "command") {
        var box = el("div", "rp-entry rp-cmd" + (e.status === "failed" ? " failed" : "")), pre = el("pre"), c = el("span", "c"), o = el("span", "o"), expanded = false;
        box.appendChild(el("span", "rp-who", "Shell"));
        pre.appendChild(c); pre.appendChild(o); box.appendChild(pre);
        var foot = el("div", "rp-foot");
        if (e.exit) foot.appendChild(el("span", "rp-bad", "exit " + e.exit));
        if (e.truncated) foot.appendChild(el("span", null, "Output truncated in the retained record"));
        if (abridge(e.text).more) {
          var more = el("button", "rp-link", "Show full output");
          more.type = "button";
          more.addEventListener("click", function () {
            pause(true); expanded = !expanded;
            o.textContent = expanded ? "\n" + e.text : seg.text.slice(seg.text.indexOf("\n"));
            more.textContent = expanded ? "Show less" : "Show full output";
          });
          foot.appendChild(more);
        }
        if (foot.childNodes.length) box.appendChild(foot);
        return { el: box, fill: function (n) {
          if (expanded) return;
          var text = seg.text.slice(0, n), cut = text.indexOf("\n");
          c.textContent = cut < 0 ? text : text.slice(0, cut);
          o.textContent = cut < 0 ? "" : text.slice(cut);
        } };
      }
      if (e.kind === "agent_message" || e.kind === "plan") {
        var msg = el("div", "rp-entry rp-msg"), body = el("p");
        msg.appendChild(el("span", "rp-who", e.kind === "plan" ? "Plan" : "Agent"));
        msg.appendChild(body);
        return { el: msg, fill: function (n) { body.textContent = seg.text.slice(0, n); } };
      }
      var row = el("div", "rp-entry rp-row " + (e.kind === "edit" ? "edit" : "gui") + (e.status === "failed" ? " failed" : ""));
      row.appendChild(el("span", "rp-who", e.kind === "edit" ? "Edit" : "Browser"));
      row.appendChild(el("span", "rp-what", e.kind === "edit" ? e.text : describe(e)));
      if (e.status === "failed") row.appendChild(el("span", "rp-bad", "failed"));
      if (e.frame != null) row.appendChild(el("span", "rp-chip", "Frame " + (e.frame + 1)));
      return { el: row, fill: noop };
    }
    function verifyCard() {
      var card = el("div", "rp-verify"), top = el("div", "rp-verify-head");
      top.appendChild(el("span", "rp-who", "Independent verifier"));
      top.appendChild(el("strong", ep.passed ? "rp-good" : "rp-bad", ep.passed ? "Passed" : "Failed"));
      card.appendChild(top);
      ep.verifier.forEach(function (v) {
        var pre = el("pre");
        pre.appendChild(el("span", "c", "$ " + v.command + "\n"));
        pre.appendChild(el("span", "o", v.stdout));
        card.appendChild(pre);
      });
      card.appendChild(el("p", null, ep.end_note));
      var patch = el("details"), code = el("pre", "rp-diff");
      patch.appendChild(el("summary", null, "Submitted patch"));
      ep.patch.split("\n").forEach(function (line) {
        var cls = /^\+(?!\+\+)/.test(line) ? "add" : /^-(?!--)/.test(line) ? "del" : /^@@/.test(line) ? "hunk" : null;
        code.appendChild(el("span", cls, line + "\n"));
      });
      patch.appendChild(code); card.appendChild(patch);
      return card;
    }
    function renderHistory() {
      if (history.dataset.ready) return;
      var list = el("ol");
      ep.events.forEach(function (e) {
        var li = el("li"), headLine = el("div", "rp-h-head");
        headLine.appendChild(el("span", "n", String(e.seq)));
        headLine.appendChild(el("span", "k", e.kind.replace("_", " ") + (e.status === "failed" ? " · failed" : "") + (e.frame != null ? " · frame " + (e.frame + 1) : "")));
        headLine.appendChild(el("code", null, e.title));
        li.appendChild(headLine);
        if (e.text) li.appendChild(el("pre", null, e.text));
        list.appendChild(li);
      });
      history.appendChild(el("p", "rp-h-source", "Source: " + ep.source));
      history.appendChild(list);
      history.dataset.ready = "1";
    }

    function showFrame(i) {
      if (i === st.frame) return;
      st.frame = i;
      var f = ep.frames[i];
      img.hidden = marker.hidden = keycap.hidden = true; empty.hidden = i >= 0;
      bar.textContent = i < 0 ? "Browser · no frame yet" : "Frame " + (i + 1) + " of " + ep.frames.length + " · " + f.time + " UTC";
      if (i < 0) return;
      img.src = open.href = f.src; img.hidden = false;
      img.alt = "Recorded game frame " + (i + 1) + (f.action ? " after: " + describe({ title: "visual_cua.act", text: JSON.stringify(f.action) }) : "");
      if (!reduced.matches && img.animate) img.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 250 });
      var a = f.action;
      if (a && a.x != null) {
        marker.style.left = (a.x / 1280 * 100) + "%"; marker.style.top = (a.y / 720 * 100) + "%"; marker.hidden = false;
      }
      if (a) { keycap.textContent = "Recorded input: " + describe({ title: "visual_cua.act", text: JSON.stringify(a) }); keycap.hidden = false; }
    }
    function render(rebuild) {
      var snap = snapshot(ep, tl, st.pos);
      if (rebuild || snap.visible < st.shown) { stream.replaceChildren(); st.nodes = []; st.shown = 0; st.full = 0; }
      while (st.shown < snap.visible) {
        var node = makeNode(tl.segs[st.shown]);
        st.nodes.push(node); stream.appendChild(node.el); st.shown++;
      }
      for (var k = st.full; k < snap.visible; k++) {
        var seg = tl.segs[k];
        st.nodes[k].fill(shownLength(seg, st.pos, reduced.matches));
        if (k === st.full && st.pos >= seg.start + seg.reveal) st.full++;
      }
      showFrame(snap.frame);
      stageButtons.forEach(function (b, i) {
        b.setAttribute("aria-current", i === snap.stage && snap.visible ? "step" : "false");
        b.classList.toggle("done", i < snap.stagesDone);
      });
      if (snap.stage !== st.stage && snap.visible) {
        st.stage = snap.stage;
        announcer.textContent = "Stage " + (snap.stage + 1) + " of " + ep.stages.length + ": " + ep.stages[snap.stage].title;
      }
      position.textContent = (snap.visible ? snap.stage + 1 : 0) + " / " + ep.stages.length;
      seekBar.value = Math.round(st.pos / tl.duration * 1000);
      badge.textContent = snap.done ? "Complete" : st.playing ? "Replaying" : snap.visible ? "Paused" : "Ready";
      playBtn.textContent = st.playing ? "❚❚ Pause" : "▶ Play";
      playBtn.setAttribute("aria-label", st.playing ? "Pause replay" : "Play replay");
      if (st.playing) stream.scrollTop = stream.scrollHeight;
      return snap;
    }
    function tick(now) {
      if (!st.playing) return;
      if (st.last) st.pos = Math.min(tl.duration, st.pos + Math.min(200, now - st.last) * st.speed);
      st.last = now;
      if (render().done) {
        st.playing = false; st.raf = 0; st.last = 0; render();
        if (st.loop && st.visible && !st.manual && !document.hidden) st.loopTimer = setTimeout(function () {
          st.loopTimer = 0;
          if (st.visible && !st.manual && st.loop && !document.hidden) play();
        }, 3000);
      } else st.raf = requestAnimationFrame(tick);
    }
    function play() {
      clearTimeout(st.loopTimer); st.loopTimer = 0;
      if (st.pos >= tl.duration) { st.pos = 0; render(true); }
      st.playing = true; st.manual = false; st.last = 0; reading.hidden = true;
      if (!st.preloaded) { st.preloaded = true; ep.frames.forEach(function (f) { new Image().src = f.src; }); }
      render(); st.raf = requestAnimationFrame(tick);
    }
    function pause(manual) {
      cancelAnimationFrame(st.raf); clearTimeout(st.loopTimer);
      var wasPlaying = st.playing;
      st.raf = 0; st.loopTimer = 0; st.playing = false; st.last = 0;
      if (manual) st.manual = true;
      if (manual === "reading" && wasPlaying) reading.hidden = false;
      render();
    }
    function seek(pos) {
      var back = pos < st.pos;
      pause(true); reading.hidden = true;
      st.pos = Math.max(0, Math.min(tl.duration, pos));
      render(back);
      stream.scrollTop = stream.scrollHeight;
    }

    playBtn.addEventListener("click", function () { if (st.playing) pause(true); else play(); });
    resume.addEventListener("click", play);
    againBtn.addEventListener("click", function () { pause(); st.pos = 0; render(true); play(); });
    prevBtn.addEventListener("click", function () { var s = snapshot(ep, tl, st.pos); seek(stageEnd(tl, Math.max(0, Math.min(s.stagesDone, s.stage) - 1))); });
    nextBtn.addEventListener("click", function () {
      var s = snapshot(ep, tl, st.pos);
      seek(s.stagesDone <= s.stage ? stageEnd(tl, s.stage) : s.stage + 1 < ep.stages.length ? stageEnd(tl, s.stage + 1) : tl.duration);
    });
    loopBox.addEventListener("change", function () { st.loop = loopBox.checked; if (!st.loop) clearTimeout(st.loopTimer); });
    speed.addEventListener("change", function () { st.speed = Number(speed.value); });
    seekBar.addEventListener("input", function () { seek(seekBar.value / 1000 * tl.duration); });
    history.addEventListener("toggle", function () { if (history.open) { pause(true); renderHistory(); } });
    ["wheel", "touchstart", "pointerdown"].forEach(function (type) {
      stream.addEventListener(type, function () { if (st.playing) pause("reading"); }, { passive: true });
    });
    stream.addEventListener("keydown", function (event) {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].indexOf(event.key) >= 0 && st.playing) pause("reading");
    });

    // Autoplay while visible; reduced motion shows the complete record instead.
    if (reduced.matches) st.pos = tl.duration;
    render(true);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        st.visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.18;
        if (!st.visible) { if (st.playing) pause(); }
        else if (!st.manual && !reduced.matches && !document.hidden && !st.playing && !st.loopTimer && (st.pos < tl.duration || st.loop)) play();
      }, { threshold: [0, 0.18, 0.4] }).observe(grid);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (st.playing) pause(); }
      else if (st.visible && !st.manual && !reduced.matches && (st.pos < tl.duration || st.loop)) play();
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { makeTimeline: makeTimeline, snapshot: snapshot, shownLength: shownLength, stageEnd: stageEnd, display: display };
  } else {
    document.querySelectorAll("[data-episode]").forEach(function (root) {
      var ep = (window.CUA_SWE_EPISODES || []).filter(function (x) { return x.id === root.getAttribute("data-episode"); })[0];
      if (ep) mount(root, ep);
    });
  }
})();
