#!/usr/bin/env python3
"""Build a replay episode from a presentation trajectory bundle.

Usage: python3 tools/build_episode.py --bundle <game-cua task dir> --curation tools/episodes/<id>.json

The bundle is a cua-swe-viewer `media/source/agent/game-cua/<task>` directory. Event text is copied
verbatim; frames are byte-identical copies, checked against the bundle's frame-mapping hashes.
Only stage titles and one-line insights in the curation file are editorial.
"""
import argparse, hashlib, json, pathlib, shutil

SITE = pathlib.Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--bundle", required=True, type=pathlib.Path)
    ap.add_argument("--curation", required=True, type=pathlib.Path)
    a = ap.parse_args()
    cur = json.loads(a.curation.read_text())
    b = a.bundle
    load = lambda rel: json.loads((b / rel).read_text())
    meta, summary = load("metadata.json"), load("evaluation-summary.json")
    activity, prov = load("agent/activity.json"), load("agent/activity-provenance.json")
    manifest, verifier = load("agent/frame-manifest.json"), load("agent/verifier-report.json")
    task = next(t for t in json.loads((SITE / "data/tasks.json").read_text())["tasks"] if t["id"] == cur["task_id"])
    assert meta["task_id"] == activity["task_id"] == cur["task_id"], "bundle does not match curation"

    # Stages must tile the event sequence exactly, in order.
    events = activity["events"]
    seqs = [e["sequence"] for e in events]
    assert seqs == list(range(1, len(events) + 1)), "event sequence has gaps"
    bounds = [(s["from"], s["to"]) for s in cur["stages"]]
    assert bounds[0][0] == 1 and bounds[-1][1] == len(events), "stages must cover every event"
    assert all(prev[1] + 1 == nxt[0] and nxt[0] <= nxt[1] for prev, nxt in zip(bounds, bounds[1:])), "stages overlap or skip"

    # Frames: verify against the mapping, copy once per distinct image.
    out_dir = SITE / "assets/media/episodes" / cur["id"]
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    by_frame = {m["frame_sequence"]: m for m in prov["frame_mapping"]}
    frames, seen, media = [], {}, []
    for f in manifest["frames"]:
        src = b / "agent" / f["file"]
        digest = sha(src)
        assert digest == by_frame[f["sequence"]]["sha256"], "frame hash mismatch: " + f["file"]
        if digest not in seen:
            name = "frame-%02d.png" % f["sequence"]
            shutil.copyfile(src, out_dir / name)
            seen[digest] = "assets/media/episodes/%s/%s" % (cur["id"], name)
            media.append({"file": "episodes/%s/%s" % (cur["id"], name),
                          "source": "%s/agent/%s" % (cur["source"].split(" ", 1)[1], f["file"]),
                          "note": "byte-identical copy", "sha256": digest})
        action = {k: v for k, v in (f["action"] or {}).items() if v is not None}
        frames.append({"src": seen[digest], "time": f["timestamp"][11:19], "action": action or None})
    frame_of = {m["event_sequence"]: m["frame_sequence"] - 1 for m in prov["frame_mapping"]}

    rows = summary["rows"]
    count = lambda cond: [sum(r["success"] for r in rows if r["condition"] == cond), sum(1 for r in rows if r["condition"] == cond)]
    run = meta["representative_run"]
    episode = {
        "id": cur["id"], "task_id": cur["task_id"], "kicker": cur["kicker"], "title": cur["title"],
        "summary": cur["summary"], "instruction": task["instruction"], "highlight": cur["highlight"],
        "end_note": cur["end_note"],
        "run": {"model": run["model"], "label": run["label"], "code": count("code-only"), "cua": count("cua")},
        "stages": cur["stages"],
        "events": [{"seq": e["sequence"], "kind": e["kind"], "title": e["title"], "text": e["detail"],
                    "status": e["status"], "exit": e.get("exit_code"), "truncated": e.get("truncated", False),
                    "frame": frame_of.get(e["sequence"])} for e in events],
        "frames": frames,
        "verifier": [{"command": r["command"], "stdout": r["stdout"].strip(), "passed": r["passed"]} for r in verifier["results"]],
        "passed": verifier["success"],
        "patch": (b / "agent/patch.diff").read_text(),
        "source": cur["source"],
    }
    assert episode["passed"] and all(e["frame"] is None or 0 <= e["frame"] < len(frames) for e in episode["events"])

    data = SITE / "data/episodes" / (cur["id"] + ".js")
    data.parent.mkdir(parents=True, exist_ok=True)
    data.write_text("(window.CUA_SWE_EPISODES = window.CUA_SWE_EPISODES || []).push(" +
                    json.dumps(episode, ensure_ascii=False) + ");\n")

    man_path = SITE / "assets/media/manifest.json"
    entries = [m for m in json.loads(man_path.read_text()) if not m["file"].startswith("episodes/%s/" % cur["id"])]
    man_path.write_text(json.dumps(entries + media, indent=1))
    print("%s: %d events, %d stages, %d frames (%d files), %s" % (
        cur["id"], len(events), len(bounds), len(frames), len(media), data.relative_to(SITE)))


if __name__ == "__main__":
    main()
