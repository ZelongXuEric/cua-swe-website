#!/usr/bin/env python3
"""Render selected paper figures (PDF) to PNG for the website.
Requires pypdfium2 (pip install pypdfium2). Sources are the figures of the arXiv e-print
(2609.32600v1, source dated 2026-09-29), stored under paper/arxiv-2609.32600v1/figures in the
research checkout. The older Overleaf snapshot under paper/overleaf is not used.
"""
import argparse, hashlib, json, os, pathlib
import pypdfium2 as pdfium

ap = argparse.ArgumentParser()
ap.add_argument("--root", default=os.environ.get("CUA_SWE_ROOT", str(pathlib.Path.home() / "projects/cua-swe")))
ap.add_argument("--scale", type=float, default=2.4)
ROOT = pathlib.Path(ap.parse_args().root)
SRC = ROOT / "paper/arxiv-2609.32600v1/figures"
OUT = pathlib.Path(__file__).resolve().parents[1] / "assets/media/figures"
OUT.mkdir(parents=True, exist_ok=True)
FIGURES = ["figure1", "figure2", "captain-callisto-pipeline", "example-web-preprint", "example-mobile-preprint",
           "hybrid-success-time-aggregate", "paired-task-gains",
           "repair-case-web", "repair-case-game", "repair-case-devops", "repair-case-mobile"]
SCALE = {"hybrid-success-time-aggregate": 5.0, "figure1": 3.0, "captain-callisto-pipeline": 2.0,
         "example-web-preprint": 2.0, "example-mobile-preprint": 2.0}
manifest = []
for name in FIGURES:
    pdf = pdfium.PdfDocument(str(SRC / f"{name}.pdf"))
    scale = SCALE.get(name, ap.parse_args().scale)
    image = pdf[0].render(scale=scale).to_pil()
    target = OUT / f"{name}.png"
    image.save(target, optimize=True)
    manifest.append({"file": f"figures/{name}.png", "source": f"paper/arxiv-2609.32600v1/figures/{name}.pdf",
                     "note": f"rendered at scale {scale}, {image.width}x{image.height}",
                     "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    print(f"{name:32s} {image.width}x{image.height} {target.stat().st_size/1024:6.0f} KB")
json.dump(manifest, open(OUT / "manifest.json", "w"), indent=1)
