#!/usr/bin/env python3
"""Copy the retained screenshots used by the website into website/assets/media.
Sources are byte-identical retained frames under paper/; large DPR-2 captures are downscaled.
"""
import argparse, json, os, pathlib, shutil, hashlib
from PIL import Image

ap = argparse.ArgumentParser(description="Copy retained screenshots from a CUA-SWE checkout into assets/media.")
ap.add_argument("--root", default=os.environ.get("CUA_SWE_ROOT", str(pathlib.Path.home() / "projects/cua-swe")),
                help="CUA-SWE research checkout containing paper/ (default: $CUA_SWE_ROOT or ~/projects/cua-swe)")
ROOT = pathlib.Path(ap.parse_args().root)
OUT = pathlib.Path(__file__).resolve().parents[1] / "assets/media"
OUT.mkdir(parents=True, exist_ok=True)
F2 = ROOT / "paper/figure2_assets/cases"
F1 = ROOT / "paper/figure1_assets/cases"
DEMO = ROOT / "paper/demo_video"

ITEMS = [
    # (source, destination, max_width or None)
    (F2 / "01_vector_relay/originals/agent_0003.png", "vector-relay-frame-03.png", None),
    (F2 / "01_vector_relay/originals/agent_0015.png", "vector-relay-frame-15.png", None),
    (F2 / "05_captain_callisto/originals/agent_0001.png", "callisto-frame-01.jpg", None),
    (F2 / "05_captain_callisto/originals/agent_0003.png", "callisto-frame-03.jpg", None),
    (F2 / "02_letter_arc/originals/agent_0017.png", "letter-arc-frame-17.png", 800),
    (F2 / "02_letter_arc/originals/agent_0018.png", "letter-arc-frame-18.png", 800),
    (F1 / "G04_core_ball/keyframes/agent_0011.png", "core-ball-frame-11.png", None),
    (F1 / "W01_allocation_ring/keyframes/reference-baseline_stacked.png", "allocation-ring-baseline.png", 1360),
    (DEMO / "assets/media/devops_before.png", "counter-order-baseline.png", 1372),
    (DEMO / "assets/media/mobile_before.png", "mural-desk-baseline.png", 600),
    (DEMO / "exports/CUA-SWE_demo_web_720p.mp4", "cua-swe-demo-720p.mp4", None),
    (DEMO / "exports/poster.jpg", "cua-swe-demo-poster.jpg", None),
]

manifest = []
for src, dst, maxw in ITEMS:
    target = OUT / dst
    if src.suffix.lower() in (".png", ".jpg", ".jpeg") and (maxw or src.suffix.lower() != target.suffix.lower()):
        im = Image.open(src)
        if maxw and im.width > maxw:
            im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
        if target.suffix.lower() == ".jpg":
            im.convert("RGB").save(target, quality=88, optimize=True)
            note = f"re-encoded as JPEG at {im.width}x{im.height}"
        else:
            im.save(target, optimize=True)
            note = f"resized to {im.width}x{im.height}"
    else:
        shutil.copyfile(src, target)
        note = "byte-identical copy"
    manifest.append({"file": dst, "source": str(src.relative_to(ROOT)), "note": note,
                     "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    print(f"{dst:40s} {target.stat().st_size/1024:7.0f} KB  {note}")
json.dump(manifest, open(OUT / "manifest.json", "w"), indent=1)
