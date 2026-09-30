#!/usr/bin/env python3
"""Render selected paper figures (PDF) to PNG for the website.
Requires pypdfium2 (pip install pypdfium2). Sources are the Overleaf figures under paper/.
"""
import argparse, hashlib, json, os, pathlib
import pypdfium2 as pdfium

ap = argparse.ArgumentParser()
ap.add_argument("--root", default=os.environ.get("CUA_SWE_ROOT", str(pathlib.Path.home() / "projects/cua-swe")))
ap.add_argument("--scale", type=float, default=2.6)
ROOT = pathlib.Path(ap.parse_args().root)
SRC = ROOT / "paper/overleaf/figures"
OUT = pathlib.Path(__file__).resolve().parents[1] / "assets/media/figures"
OUT.mkdir(parents=True, exist_ok=True)
FIGURES = ["benchmark-environment", "captain-callisto-pipeline", "paired-task-gains",
           "repair-case-web", "repair-case-game", "repair-case-devops", "repair-case-mobile", "game-repair-iteration"]
manifest = []
for name in FIGURES:
    pdf = pdfium.PdfDocument(str(SRC / f"{name}.pdf"))
    image = pdf[0].render(scale=ap.parse_args().scale).to_pil()
    target = OUT / f"{name}.png"
    image.save(target, optimize=True)
    manifest.append({"file": f"figures/{name}.png", "source": f"paper/overleaf/figures/{name}.pdf",
                     "note": f"rendered at scale {ap.parse_args().scale}, {image.width}x{image.height}",
                     "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    print(f"{name:32s} {image.width}x{image.height} {target.stat().st_size/1024:6.0f} KB")
json.dump(manifest, open(OUT / "manifest.json", "w"), indent=1)
