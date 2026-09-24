#!/usr/bin/env python3
"""Assemble website/data/tasks.{json,js} and results.{json,js} from a CUA-SWE checkout.

Usage: python3 website/tools/build_data.py --root <checkout with dataset/ and viewer/data>
Every number in results.json is copied from the paper's Table 1 / Figure 1(b) or
recomputed from the release evaluation summaries in dataset/.
"""
import argparse, json, os, re, collections, pathlib
import yaml

APP_NAMES = {
    "echarts": "ECharts", "fabric": "Fabric.js", "jupyterlab": "JupyterLab", "quill": "Quill",
    "react-datepicker": "React DatePicker", "recharts": "Recharts", "slate": "Slate",
    "tiptap": "Tiptap", "handsontable": "Handsontable", "maplibre": "MapLibre",
    "react-spectrum": "React Spectrum", "saleor": "Saleor", "vue": "Vue", "responsive-masonry": "Masonry dashboard",
}
CONTRACT_APPS = {
    "support-window": "Support scheduling", "tax-rounding": "Tax invoicing", "delegated-action": "Delegated actions",
    "account-recovery": "Account recovery", "subscription-renewal": "Subscription renewal", "warehouse-cutoff": "Warehouse cutoff",
}
GAME_NAMES = {
    "2048": "2048", "astray": "Astray", "boxel-rebound": "Boxel Rebound", "captain-callisto": "Captain Callisto",
    "core-ball": "Core Ball", "flappy-bird": "Flappy Bird", "hextris": "Hextris", "maze-signal": "Maze Signal",
    "minesweeper": "Minesweeper", "phase-relay": "Phase Relay", "vector-relay": "Vector Relay", "wordle": "Letter Arc",
}
DEVOPS_MECH = {
    "alert-inhibition-equal-labels": "Alert inhibition with equal labels",
    "alert-pending-identity": "Pending-alert identity and receiver selector",
    "log-severity-normalization": "Log severity normalization",
    "rate-before-aggregation": "Rate before aggregation",
    "scrape-response-phase-deadline": "Scrape response phase deadline",
    "slo-availability-rollup": "SLO availability rollup",
    "statsd-gauge-update-mode": "StatsD gauge update mode",
    "tail-sampling-decision-window": "Tail-sampling decision window",
    "trace-await-context": "Trace context across await",
    "trace-clock-skew": "Trace clock skew",
}
MOBILE_FAMILY = {
    "mobile.synthetic.external-campus-wayfinding.001": "Campus Pocket",
    "mobile.synthetic.external-inspection-calibration.001": "Inspection measurements",
    "mobile.synthetic.external-kinetic-gear-plan.001": "Tideglass",
    "mobile.synthetic.external-marble-run.001": "Marble Post",
    "mobile.synthetic.external-mural-warp.001": "Mural Desk",
    "mobile.synthetic.external-packaging-proof.001": "Foldnote",
    "mobile.synthetic.external-panorama-hotspots.001": "Northline",
    "mobile.synthetic.external-sprite-exposure-board.001": "Lamp courier",
    "mobile.synthetic.external-stateful-relay-board.001": "Lantern",
    "mobile.synthetic.external-star-plate-registration.001": "Received-plate integration",
    "mobile.synthetic.external-wallet-entitlement.001": "Pass wallet",
}
MODEL_LABELS = {
    "api-gpt6-astra": "GPT-6 Astra", "api-gpt56-sol": "GPT-5.6 Sol", "api-gpt56-luna": "GPT-5.6 Luna",
    "api-gpt56-terra": "GPT-5.6 Terra", "api-opus5": "Claude Opus 5", "api-opus48": "Claude Opus 4.8",
    "api-sonnet5": "Claude Sonnet 5", "api-fable5": "Claude Fable 5", "api-grok46": "Grok 4.6",
    "codex-gpt56-sol": "Codex + GPT-5.6 Sol", "claude-code-opus5": "Claude Code + Opus 5",
}
API_MODELS = [k for k in MODEL_LABELS if k.startswith("api-")]

def words(slug):
    return slug.replace("-", " ")

def web_title(tid):
    core = re.sub(r"^(v3|web)\.", "", tid)
    core = re.sub(r"\.\d{3}$", "", core)
    variant = ""
    m = re.match(r"^(.*?)\.(lower-\d)$", core)
    if m:
        core, variant = m.group(1), " (" + m.group(2).replace("lower-", "variant ") + ")"
    for key, name in CONTRACT_APPS.items():
        if core.startswith(key):
            rest = core[len(key):].strip("-")
            rest = {"contract": "", "frontier-easy": " (easy anchor)", "frontier-anchor": " (hard anchor)"}.get(rest, " " + words(rest))
            return name + " contract" + rest + variant, name
    for key, name in sorted(APP_NAMES.items(), key=lambda kv: -len(kv[0])):
        if core.startswith(key):
            rest = core[len(key):].strip("-")
            return f"{name}: {words(rest)}{variant}", name
    return words(core) + variant, "Other"

def game_title(tid):
    core = re.sub(r"^gameqa\.", "", tid)
    core = re.sub(r"\.\d{3}$", "", core)
    for key, name in sorted(GAME_NAMES.items(), key=lambda kv: -len(kv[0])):
        if core.startswith(key):
            rest = core[len(key):].strip("-")
            return f"{name}: {words(rest)}", name
    return words(core), "Other"

def devops_title(tid):
    core = re.sub(r"^devops\.", "", tid)
    parts = core.split(".")
    mech = parts[0]
    name = DEVOPS_MECH.get(mech, words(mech))
    tags = [p for p in parts[1:] if not re.match(r"^\d{3}$", p)]
    suffix = ", ".join(t for t in tags if t not in ("frontier-hard-r1",))
    return name, name, suffix

def load_yaml(p):
    with open(p) as fh:
        return yaml.safe_load(fh)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=os.environ.get("CUA_SWE_ROOT", str(pathlib.Path.home() / "projects/cua-swe")),
                    help="CUA-SWE research checkout (default: $CUA_SWE_ROOT or ~/projects/cua-swe)")
    ap.add_argument("--out", default=str(pathlib.Path(__file__).resolve().parents[1] / "data"))
    a = ap.parse_args()
    root = pathlib.Path(a.root)
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)

    reg = json.load(open(root / "dataset/registry.json"))
    ids = {d["domain"]: d["task_ids"] for d in reg["domains"]}
    tasks = []

    # ---- Web ----
    web36 = json.load(open(root / "dataset/web/releases/web36-20260921/evaluation-summary.json"))
    wagg = collections.defaultdict(lambda: {"code": [0, 0], "cua": [0, 0]})
    for r in web36["rows"]:
        if r["model"] not in API_MODELS:
            continue
        key = "code" if r["condition"] == "code-only" else "cua"
        wagg[r["task_id"]][key][1] += 1
        wagg[r["task_id"]][key][0] += 1 if r["reported_success"] else 0
    wman = load_yaml(root / "dataset/web/manifest.yaml")
    wsubset = {t["task_id"]: t.get("release_subset") for t in wman["tasks"]}
    for tid in ids["web"]:
        ty = load_yaml(root / f"dataset/web/tasks/{tid}/task.yaml")
        title, family = web_title(tid)
        o = wagg[tid]
        tasks.append({
            "id": tid, "domain": "web", "title": title, "family": family,
            "instruction": ty["instruction"].strip(),
            "tier": None,
            "budgets": {"wall": ty["budgets"]["wall_time_sec"], "steps": ty["budgets"]["max_steps"], "gui": ty["budgets"]["max_gui_actions"]},
            "verifiers": [g for g in ("build", "unit", "ui", "visual", "state") if ty["verifiers"].get(g)],
            "viewport": ty["environment"].get("viewport_or_device"),
            "path": ty.get("repo_snapshot", {}).get("path", f"dataset/web/tasks/{tid}"),
            "outcomes": {"label": "Web-36 release evaluation, nine API models, one selected attempt each",
                          "code": {"k": o["code"][0], "n": o["code"][1]}, "cua": {"k": o["cua"][0], "n": o["cua"][1]}},
        })

    # ---- Game ----
    gman = load_yaml(root / "dataset/game/manifest.yaml")
    gmeta = {t["task_id"]: t for t in gman["tasks"]}
    for tid in ids["game"]:
        ty = load_yaml(root / f"dataset/game/tasks/{tid}/task.yaml")
        title, family = game_title(tid)
        m = gmeta[tid]
        role = m.get("role")
        tasks.append({
            "id": tid, "domain": "game", "title": title, "family": family,
            "instruction": ty["instruction"].strip(),
            "tier": role, "tier_label": {"lower_anchor": "Lower anchor", "upper_anchor": "Upper anchor", "borderline_upper_anchor": "Borderline"}.get(role, role),
            "budgets": {"wall": ty["budgets"]["wall_time_sec"], "steps": ty["budgets"]["max_steps"], "gui": ty["budgets"]["max_gui_actions"]},
            "verifiers": [g for g in ("build", "unit", "ui", "visual", "state") if ty["verifiers"].get(g)],
            "viewport": ty["environment"].get("viewport_or_device"),
            "path": f"dataset/game/tasks/{tid}",
            "seed": ty.get("game_runtime", {}).get("seed"),
            "outcomes": {"label": f"Construction trials, GPT-5.6 Sol, {m.get('attempts_per_condition', 3)} attempts per condition",
                          "code": {"k": int(m["code_only_successes"]), "n": int(m["code_only_attempts"])},
                          "cua": {"k": int(m["cua_successes"]), "n": int(m["cua_attempts"])}},
        })

    # ---- DevOps ----
    dman = load_yaml(root / "dataset/devops/manifest.yaml")
    dmeta = {t["task_id"]: t for t in dman["tasks"]}
    dview = {t["task_id"]: t for t in json.load(open(root / "viewer/data/devops-tasks.json"))["tasks"]}
    for tid in ids["devops"]:
        ty = load_yaml(root / f"dataset/devops/tasks/{tid}/task.yaml")
        title, family, suffix = devops_title(tid)
        tier = dmeta[tid]["tier"]
        v = dview.get(tid, {})
        tasks.append({
            "id": tid, "domain": "devops", "title": title + (f" ({suffix})" if suffix else ""), "family": family,
            "instruction": ty["instruction"].strip(),
            "tier": tier, "tier_label": {"lower": "Lower anchor", "upper": "Upper anchor", "differential": "GPT-6 / Fable differential"}.get(tier, tier),
            "budgets": {"wall": ty["budgets"]["wall_time_sec"], "steps": ty["budgets"]["max_steps"], "gui": ty["budgets"]["max_gui_actions"]},
            "verifiers": [g for g in ("build", "unit", "ui", "visual", "state") if ty["verifiers"].get(g)],
            "viewport": ty["environment"].get("viewport_or_device"),
            "path": f"dataset/devops/tasks/{tid}",
            "source": v.get("source_repo"), "surface": v.get("ui_surface"),
            "outcomes": None,
        })

    # ---- Mobile ----
    mman = json.load(open(root / "dataset/mobile/manifest.json"))
    mmeta = {t["task_id"]: t for t in mman["tasks"]}
    msum = json.load(open(root / "dataset/mobile/releases/mobile20-20260922/evaluation-summary.json"))
    magg = collections.defaultdict(lambda: {"code": [0, 0], "cua": [0, 0]})
    for r in msum["rows"]:
        if not r["scorable"] or r["model_key"] not in API_MODELS:
            continue
        key = "code" if r["condition"] == "code-only" else "cua"
        magg[r["task_id"]][key][1] += 1
        magg[r["task_id"]][key][0] += 1 if r["success"] else 0
    for tid in ids["mobile"]:
        m = mmeta[tid]
        text = open(root / f"dataset/mobile/tasks/{tid}/INSTRUCTION.md").read().strip()
        lines = text.splitlines()
        heading = lines[0].lstrip("# ").strip() if lines and lines[0].startswith("#") else None
        body = "\n".join(lines[1:]).strip() if heading else text
        fam = m["family"]
        if fam.startswith("mobile.synthetic."):
            fam = MOBILE_FAMILY.get(tid, m["title"].split(" \u2014 ")[0].strip())
        o = magg[tid]
        title = m["title"]
        if m["family"] == "Gantt":
            title = title.replace(" \u2014 ", ": ") + " (" + tid.rsplit(".", 1)[1] + ")"
        tasks.append({
            "id": tid, "domain": "mobile", "title": title, "family": fam,
            "instruction": body, "instruction_heading": heading,
            "tier": m["role"], "tier_label": {"lower_anchor": "Lower anchor", "upper_anchor": "Upper anchor", "asymmetric_anchor": "Asymmetric anchor"}.get(m["role"], m["role"]),
            "budgets": {"wall": 2700, "steps": 60, "gui": None},
            "verifiers": ["protected native verifier"],
            "viewport": "mobile-400x800",
            "path": f"dataset/mobile/tasks/{tid}",
            "outcomes": {"label": "Mobile release evaluation, scorable API-model cells only",
                          "code": {"k": o["code"][0], "n": o["code"][1]}, "cua": {"k": o["cua"][0], "n": o["cua"][1]}},
        })

    order = {"web": 0, "game": 1, "devops": 2, "mobile": 3}
    tasks.sort(key=lambda t: (order[t["domain"]], t["family"], t["id"]))
    payload = {
        "release_id": reg["release_id"], "task_count": reg["task_count"],
        "domains": [{"domain": d, "count": len(ids[d])} for d in ("web", "game", "devops", "mobile")],
        "tasks": tasks,
    }
    json.dump(payload, open(out / "tasks.json", "w"), indent=1, ensure_ascii=False)
    open(out / "tasks.js", "w").write("window.CUA_SWE_TASKS = " + json.dumps(payload, ensure_ascii=False) + ";\n")
    print("tasks:", len(tasks), collections.Counter(t["domain"] for t in tasks))
    print("families:", {d: sorted(set(t["family"] for t in tasks if t["domain"] == d)) for d in order})

if __name__ == "__main__":
    main()
