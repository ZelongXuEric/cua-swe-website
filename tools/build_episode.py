#!/usr/bin/env python3
"""Build a replay episode from a recorded agent run.

Usage: python3 tools/build_episode.py --bundle <dir> --curation tools/episodes/<id>.json

Two source formats are read:
- a presentation bundle (cua-swe-viewer `media/source/agent/game-cua/<task>`), and
- a raw evaluation run (`rollout/responses-agent-trajectory.jsonl` plus `web-cua/`).
Event text is copied verbatim and frames are byte-identical copies. Only the stage titles,
one-line insights and notes in the curation file are editorial.
"""
import argparse, hashlib, json, pathlib, re, shutil, struct

SITE = pathlib.Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png_size(path):
    with open(path, "rb") as fh:
        head = fh.read(24)
    assert head[:8] == b"\x89PNG\r\n\x1a\n", "not a PNG: %s" % path
    return list(struct.unpack(">II", head[16:24]))


def compact(action):
    return {k: v for k, v in (action or {}).items() if v is not None} or None


def load_bundle(b):
    """Presentation bundle: events and frame mapping are already aligned."""
    load = lambda rel: json.loads((b / rel).read_text())
    activity, prov = load("agent/activity.json"), load("agent/activity-provenance.json")
    by_frame = {m["frame_sequence"]: m for m in prov["frame_mapping"]}
    frames = []
    for f in load("agent/frame-manifest.json")["frames"]:
        src = b / "agent" / f["file"]
        assert sha(src) == by_frame[f["sequence"]]["sha256"], "frame hash mismatch: " + f["file"]
        frames.append({"path": src, "source": "agent/" + f["file"], "time": f["timestamp"][11:19], "action": compact(f["action"])})
    frame_of = {m["event_sequence"]: m["frame_sequence"] - 1 for m in prov["frame_mapping"]}
    events = [{"seq": e["sequence"], "kind": e["kind"], "title": e["title"], "text": e["detail"], "status": e["status"],
               "exit": e.get("exit_code"), "truncated": e.get("truncated", False), "frame": frame_of.get(e["sequence"])}
              for e in activity["events"]]
    rows = load("evaluation-summary.json")["rows"]
    count = lambda cond: [sum(r["success"] for r in rows if r["condition"] == cond), sum(1 for r in rows if r["condition"] == cond)]
    report = load("agent/verifier-report.json")
    return {"task_id": activity["task_id"], "events": events, "frames": frames, "turn_of": None,
            "code": count("code-only"), "cua": count("cua"), "report": report,
            "patch": (b / "agent/patch.diff").read_text()}


def load_run(b, edit_turns):
    """Raw evaluation run: one tool call per assistant turn; GUI calls go through web_cua_launcher."""
    records = [json.loads(line) for line in (b / "rollout/responses-agent-trajectory.jsonl").read_text().splitlines() if line.strip()]
    gui = [json.loads(line) for line in (b / "web-cua/trajectory.jsonl").read_text().splitlines() if line.strip()]
    result = json.loads((b / "result.json").read_text())
    tools = {r["turn"]: r for r in records if r["event"] == "tool"}
    frames = []
    for g in gui:
        name = pathlib.Path(g["observation"]["screenshot_path"]).name
        frames.append({"path": b / "web-cua" / name, "source": "web-cua/" + name, "time": g["timestamp"][11:19], "action": compact(g.get("action"))})
    events, gui_next = [], 0
    for a in (r for r in records if r["event"] == "assistant"):
        turn = a["turn"]
        if a.get("content"):
            events.append({"kind": "agent_message", "title": "Agent update", "text": a["content"], "status": "completed", "turn": turn})
        assert len(a["tool_calls"]) == 1, "expected one tool call per turn"
        tool = tools[turn]
        args, out = tool["arguments"], tool["result"]
        m = re.match(r"exit_code: (-?\d+)", out)
        code = int(m.group(1)) if m else None
        status = "failed" if tool["is_error"] or code not in (None, 0) else "completed"
        e = {"turn": turn, "status": status, "exit": code}
        if tool["name"] == "view_image":
            shot = re.search(r"screenshot-(\d+)\.png", args["path"]).group(1)
            e.update(kind="computer_use", title="view_image", text=out, frame=int(shot) - 1)
        elif tool["name"] == "finish":
            e.update(kind="finish", title="Finish", text=args["summary"])
        elif "web_cua_launcher" in args["command"]:
            sub = re.search(r"web_cua_launcher (\w+)", args["command"]).group(1)
            action = None
            if sub in ("observe", "act"):
                action = gui[gui_next].get("action"); gui_next += 1
            e.update(kind="computer_use", title="visual_cua." + sub, text=json.dumps(compact(action) or {}),
                     full="$ " + args["command"] + "\n" + out)
        else:
            e.update(kind="command", title=args["command"], text=out, edit=turn in edit_turns)
        events.append(e)
    assert gui_next == len(gui) == len(frames), "GUI calls and recorded frames differ"
    for i, e in enumerate(events):
        e["seq"] = i + 1
        e.setdefault("frame", None); e.setdefault("truncated", False)
    report = json.loads((b / "verifier_report.json").read_text())
    return {"task_id": result["task_id"], "events": events, "frames": frames, "report": report,
            "native_success": result["native_success"], "patch": (b / "patch.diff").read_text()}


def keep_files(patch, files):
    blocks = re.split(r"(?m)^(?=diff --git )", patch)
    return "".join(x for x in blocks if any(x.startswith("diff --git a/%s " % f) for f in files)).rstrip("\n")


def comparison(run_dir, label):
    report = json.loads((run_dir / "verifier_report.json").read_text())
    result = json.loads((run_dir / "result.json").read_text())
    ui = next(r for r in report["results"] if r["group"] == "ui")
    states = re.findall(r"(?m)^([\w-]+): (PASS|FAIL|COVERAGE)", ui["stdout"])
    stop = next(((n, s) for n, s in states if s != "PASS"), None)
    text = "%d of %d reached checkpoints pass" % (sum(s == "PASS" for _, s in states), len(states))
    if stop:
        text += "; stops at %s (%s)" % stop
    return {"label": label, "text": text + ". Scored as %s." % ("a success" if result["native_success"] else "a failure")}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--bundle", required=True, type=pathlib.Path)
    ap.add_argument("--curation", required=True, type=pathlib.Path)
    a = ap.parse_args()
    cur = json.loads(a.curation.read_text())
    b = a.bundle
    raw = (b / "rollout").is_dir()
    src = load_run(b, set(cur.get("edit_turns", []))) if raw else load_bundle(b)
    task = next(t for t in json.loads((SITE / "data/tasks.json").read_text())["tasks"] if t["id"] == cur["task_id"])
    assert src["task_id"] == cur["task_id"], "run does not match curation"
    events = src["events"]
    assert [e["seq"] for e in events] == list(range(1, len(events) + 1)), "event sequence has gaps"

    # Stages tile the events in order; raw runs give stage bounds as assistant turns.
    stages = []
    for s in cur["stages"]:
        lo, hi = (s["from"], s["to"]) if not raw else (
            min(e["seq"] for e in events if e["turn"] >= s["turns"][0]), max(e["seq"] for e in events if e["turn"] <= s["turns"][1]))
        stages.append({"from": lo, "to": hi, "title": s["title"], "insight": s["insight"]})
    assert stages[0]["from"] == 1 and stages[-1]["to"] == len(events), "stages must cover every event"
    assert all(p["to"] + 1 == n["from"] and n["from"] <= n["to"] for p, n in zip(stages, stages[1:])), "stages overlap or skip"

    # Frames: copy once per distinct image.
    out_dir = SITE / "assets/media/episodes" / cur["id"]
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    viewport = png_size(src["frames"][0]["path"])
    frames, seen, media = [], {}, []
    for i, f in enumerate(src["frames"]):
        assert png_size(f["path"]) == viewport, "frames differ in size"
        digest = sha(f["path"])
        if digest not in seen:
            name = "frame-%02d.png" % (i + 1)
            shutil.copyfile(f["path"], out_dir / name)
            seen[digest] = "assets/media/episodes/%s/%s" % (cur["id"], name)
            media.append({"file": "episodes/%s/%s" % (cur["id"], name), "source": "%s/%s" % (cur["source"], f["source"]),
                          "note": "byte-identical copy", "sha256": digest})
        frames.append({"src": seen[digest], "time": f["time"], "action": f["action"]})
    for e in events:
        e.pop("turn", None)
        assert e["frame"] is None or 0 <= e["frame"] < len(frames)

    if raw:
        o = task["outcomes"]
        code, cua = [o["code"]["k"], o["code"]["n"]], [o["cua"]["k"], o["cua"]["n"]]
    else:
        code, cua = src["code"], src["cua"]
    report = src["report"]
    patch = src["patch"] if not cur.get("patch_files") else keep_files(src["patch"], cur["patch_files"])
    episode = {
        "id": cur["id"], "task_id": cur["task_id"], "kicker": cur["kicker"], "title": cur["title"],
        "summary": cur["summary"], "instruction": task["instruction"], "highlight": cur["highlight"],
        "end_note": cur["end_note"], "viewport": viewport,
        "run_text": "%s · %s · %s: code-only %d/%d · with computer use %d/%d" % (cur["model"], cur["run_kind"], cur["cohort"], code[0], code[1], cua[0], cua[1]),
        "stages": stages, "events": events, "frames": frames,
        "verifier": [{"command": r["command"], "stdout": r["stdout"].strip(), "passed": r["passed"]} for r in report["results"]],
        "passed": report["success"], "patch": patch, "patch_note": cur.get("patch_note"),
        # Comparison runs sit beside the replayed run, e.g. ../gpt56-sol-cua.
        "comparisons": [comparison(b.parent / c["dir"], c["label"]) for c in cur.get("comparisons", [])],
        "source": cur["source"],
    }
    assert episode["passed"], "the replayed run must pass its verifier"

    data = SITE / "data/episodes" / (cur["id"] + ".js")
    data.parent.mkdir(parents=True, exist_ok=True)
    data.write_text("(window.CUA_SWE_EPISODES = window.CUA_SWE_EPISODES || []).push(" + json.dumps(episode, ensure_ascii=False) + ");\n")
    man_path = SITE / "assets/media/manifest.json"
    entries = [m for m in json.loads(man_path.read_text()) if not m["file"].startswith("episodes/%s/" % cur["id"])]
    man_path.write_text(json.dumps(entries + media, indent=1))
    print("%s: %d events, %d stages, %d frames (%d files) at %dx%d, %s" % (
        cur["id"], len(events), len(stages), len(frames), len(media), viewport[0], viewport[1], data.relative_to(SITE)))


if __name__ == "__main__":
    main()
