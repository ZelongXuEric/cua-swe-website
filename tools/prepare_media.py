#!/usr/bin/env python3
"""Copy retained screenshots and the full overview video into website/assets/media.
Sources are byte-identical retained frames under paper/; large DPR-2 captures are downscaled.
"""
import argparse, json, os, pathlib, shutil, hashlib
from PIL import Image

ap = argparse.ArgumentParser(description="Copy retained screenshots and the full overview video into assets/media.")
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
    # Preserve the complete 50-second overview and its opening title card.
    (DEMO / "exports/CUA-SWE_demo_web_720p.mp4", "cua-swe-demo-loop.mp4", None),
    (DEMO / "exports/poster.jpg", "cua-swe-demo-poster.jpg", None),
]

# Hero collage: matched baseline/repaired pairs, cropped to the same window per domain and
# encoded as WebP. Web and Mobile are 16:10 crops; Game (16:9) and the full DevOps chart panel
# are kept whole and letterboxed by the page. Web, DevOps and Mobile pairs are reference-repair replays; the Game
# pair is two recorded GPT-5.6 Sol screenshots from the selected Vector Relay attempt.
HERO = [
    # (source, destination, crop box (left, top, right, bottom) or None)
    (F1 / "W01_allocation_ring/keyframes/reference-baseline_stacked.png", "hero/web-before.webp", (0, 0, 1700, 1062)),
    (F1 / "W01_allocation_ring/keyframes/reference-gold_stacked.png", "hero/web-after.webp", (0, 0, 1700, 1062)),
    (F2 / "01_vector_relay/originals/agent_0003.png", "hero/game-before.webp", None),
    (F2 / "01_vector_relay/originals/agent_0015.png", "hero/game-after.webp", None),
    (F1 / "D01_counter_order/keyframes/baseline_rolling-restart_layout.png", "hero/devops-before.webp", (0, 0, 2120, 920)),
    (F1 / "D01_counter_order/keyframes/gold_rolling-restart_layout.png", "hero/devops-after.webp", (0, 0, 2120, 920)),
    (DEMO / "assets/media/mobile_before.png", "hero/mobile-before.webp", (20, 567, 780, 1042)),
    (DEMO / "assets/media/mobile_after.png", "hero/mobile-after.webp", (20, 567, 780, 1042)),
]
HERO_WIDTH = 1000

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
(OUT / "hero").mkdir(exist_ok=True)
for src, dst, box in HERO:
    target = OUT / dst
    im = Image.open(src).convert("RGB")
    if box:
        im = im.crop(box)
    if im.width > HERO_WIDTH:
        im = im.resize((HERO_WIDTH, round(im.height * HERO_WIDTH / im.width)), Image.LANCZOS)
    im.save(target, "WEBP", quality=88, method=6)
    note = (f"cropped to {box} then " if box else "") + f"encoded as WebP at {im.width}x{im.height}"
    manifest.append({"file": dst, "source": str(src.relative_to(ROOT)), "note": note,
                     "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    print(f"{dst:40s} {target.stat().st_size/1024:7.0f} KB  {note}")
# Site icons: the robot mark from the paper's logo (735 KB at 1254x1254), without the wordmark,
# padded to a square and downscaled. The touch icon gets a white background.
LOGO = ROOT / "paper/arxiv-2609.32600v1/figures/logo.png"
logo = Image.open(LOGO).convert("RGBA")
mark = logo.crop((0, 0, logo.width, 990))  # the wordmark starts at row 996
mark = mark.crop(mark.getchannel("A").getbbox())
side = max(mark.size)
for dst, size, background in (("favicon.png", 64, (0, 0, 0, 0)), ("apple-touch-icon.png", 180, (255, 255, 255, 255))):
    square = Image.new("RGBA", (round(side * 1.08),) * 2, background)
    square.alpha_composite(mark, ((square.width - mark.width) // 2, (square.height - mark.height) // 2))
    target = OUT / dst
    square.resize((size, size), Image.LANCZOS).save(target, optimize=True)
    manifest.append({"file": dst, "source": str(LOGO.relative_to(ROOT)), "note": f"robot mark cropped from the logo, {size}x{size}",
                     "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    print(f"{dst:40s} {target.stat().st_size/1024:7.0f} KB  {size}x{size}")
json.dump(manifest, open(OUT / "manifest.json", "w"), indent=1)
