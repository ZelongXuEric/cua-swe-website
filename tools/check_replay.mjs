// Self-check for assets/js/replay.js against every built episode: node tools/check_replay.mjs
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { makeTimeline, snapshot, shownLength, stageEnd } = require("../assets/js/replay.js");
const window = {};
for (const file of readdirSync(new URL("../data/episodes/", import.meta.url))) {
  vm.runInNewContext(readFileSync(new URL("../data/episodes/" + file, import.meta.url), "utf8"), { window });
}

for (const ep of window.CUA_SWE_EPISODES) {
  const tl = makeTimeline(ep);
  // Segments tile the timeline in order.
  tl.segs.forEach((s, i) => {
    assert.equal(s.start, i ? tl.segs[i - 1].end : 0);
    assert.ok(s.end > s.start && s.reveal <= s.end - s.start);
  });
  // Every event appears exactly once, in record order.
  assert.equal(JSON.stringify(tl.segs.filter((s) => s.type === "event").map((s) => s.index)), JSON.stringify(ep.events.map((_, i) => i)));
  // Streamed text only grows and ends complete.
  for (const s of tl.segs) {
    let last = 0;
    for (let t = s.start; t <= s.end; t += 7) {
      const n = shownLength(s, t, false);
      assert.ok(n >= last && n <= s.text.length); last = n;
    }
    assert.equal(shownLength(s, s.end, false), s.text.length);
  }
  // Each stage end shows that stage complete; frames never move backwards.
  ep.stages.forEach((_, i) => assert.equal(snapshot(ep, tl, stageEnd(tl, i)).stagesDone, i + 1));
  let frame = -1;
  for (let t = 0; t <= tl.duration; t += 50) {
    const f = snapshot(ep, tl, t).frame;
    assert.ok(f >= frame); frame = f;
  }
  const end = snapshot(ep, tl, tl.duration);
  assert.ok(end.done && end.visible === tl.segs.length && end.frame === Math.max(...ep.events.map((e) => e.frame ?? -1)));
  console.log(`${ep.id}: ok, ${tl.segs.length} segments, ${(tl.duration / 1000).toFixed(1)} s at 1x`);
}
