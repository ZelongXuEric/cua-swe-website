# CUA-SWE project website

A static research site in the style of an academic project page: `index.html` has the paper
front matter (title, authors with numbered affiliations as in the paper, buttons), an overview
(abstract, one before/after task per domain, then the paper's pipeline figure), results
(inline-SVG grouped bar charts, an efficiency scatter and the paper's Table 1, collapsed by
default), a recorded repair example, the four domains, analysis (paired gains, four case
figures, two failures), evaluation (the three verifier checks as a table, task construction and
the task-validation figure) and the citation. `tasks.html` explores all 105 tasks; `results.html` redirects to
the results section. GitHub Pages serves the repository root. No build step or JavaScript
dependencies are required.

Preview locally:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

## Sources of truth

The research repository is separate. This repository contains display copies
of its task data and retained media.

| Content | Source |
| --- | --- |
| Task inventory, original instructions, budgets and families | `tools/build_data.py` reads the canonical registry, domain manifests, task descriptors and release summaries. Run `python3 tools/build_data.py --root <research-checkout>`. |
| Per-domain pass@1 results | `TABLE1` in `assets/js/site.js`, transcribed from `paper/evaluation/final-evaluation-report.md` (September 24, 2026) and identical to Table 1 of arXiv 2609.32600v1. The per-domain charts, the four-domain mean (panel a, equal domain weights, matching the right panel of Figure 1 in the paper) and the table are all rendered from it. `COLOR` gives each model the hue used in the paper's figures. Panel c is the paper's Figure 6a as an image. |
| Paper figures | `assets/media/figures/*.png`, rendered by `tools/render_figures.py` (needs `pypdfium2`) from the **arXiv e-print** figures stored at `paper/arxiv-2609.32600v1/figures` in the research checkout (source dated 2026-09-29). The older Overleaf snapshot under `paper/overleaf` (2026-09-23) has outdated figures and must not be used. Rendered: Figure 2 pipeline (Overview, after the real screenshots; the left half of Figure 1 is no longer shown because Figure 2 covers it and also draws the Code-only and Hybrid conditions), Figures 3–4 task examples (Tasks), Figure 5 (reference validation, under Evaluation), Figure 6a, Figure 20 paired gains, Figures 28–31 repair cases. The appendix's task-construction figure (Figure 8) is deliberately not used. Sources and hashes are in `assets/media/figures/manifest.json`. |
| Vector Relay repair episode | Retained screenshots, patch, shell outputs and verifier report in `paper/figure2_assets/cases/01_vector_relay`. The five steps are a selected excerpt of one recorded attempt. |
| Other screenshots | `tools/prepare_media.py --root <research-checkout>` copies retained frames from `paper/figure1_assets`, `paper/figure2_assets` and `paper/demo_video`. `assets/media/manifest.json` records file sources and hashes. |
| Overview strip | `assets/media/hero/*.webp`: matched baseline/repaired pairs, one per domain, produced by `tools/prepare_media.py` from `paper/figure1_assets` (Allocation Ring and Counter Order reference replays), `paper/figure2_assets` (Vector Relay screenshots 3 and 15 from the recorded GPT-5.6 Sol attempt) and `paper/demo_video/assets/media` (Mural Desk baseline and reference plan). Crop boxes are recorded in `assets/media/manifest.json`. |
| Site icons | `assets/media/favicon.png` (64 px) and `apple-touch-icon.png` (180 px): the robot mark cropped from `paper/arxiv-2609.32600v1/figures/logo.png` by `tools/prepare_media.py`. The 735 KB original is not served. |
| Link preview | `assets/media/og-image.png` (1200×630), a screenshot of `tools/og-image.html` taken by `tools/render_og_image.py` (needs Playwright). It shows the four before/after pairs of the overview strip; re-render it whenever `assets/media/hero` changes. |
| Overview video | Byte-identical copy of the full 50-second `paper/demo_video/exports/CUA-SWE_demo_web_720p.mp4` and its poster remain in `assets/media` for later use; the current page does not embed them. |

The task data was generated from research revision `2d86f0e1`: 36 Web,
29 Game, 20 DevOps and 20 Mobile tasks. Generator inputs must come from
that revision or a later canonical release, not an older local `main`.

Keep the four domain denominators separate. The Game table shows original
pass@1, not the revised first attempts from the pass@3 cohort. Mobile Opus 5
conditions are deferred and have no score. Do not convert them to zero.

The task explorer preserves original instructions and exposes budgets,
provenance and recorded task-level outcomes on expansion. Game task-level
outcomes are construction trials, as identified by their source labels;
they are not the final pass@1 model comparison.

## Presentation and interaction

The layout follows the conventions of academic project pages (centered mono title, blue
author line, pill buttons, centered section headings, figures with captions). Fonts are
Noto Sans and Inconsolata from Google Fonts; all other assets are local. Charts are inline
SVG generated by `assets/js/site.js`: one hue per model as in the paper, a lighter bar for
Code-only and a solid bar for Hybrid, value labels on every bar, a 0–100 axis, and red gain
labels on the overall panel. The legend sits above the panels and uses neutral gray swatches, since hue
identifies the model. The conditions are named Code-only (Coding / CLI) and Hybrid
(Computer use + Coding / CLI), following the paper. Figures open in a lightbox. The recorded
repair episode is manual and keyboard-accessible; task URL hashes open the corresponding
original instruction.

Keep the copy short and factual. Use real evidence as the visual focus. Avoid decorative
badges, repeated metadata rows and reconstructed agent actions.

`LINKS` in `assets/js/site.js` and `assets/js/tasks.js` defines external URLs, including
the arXiv abstract and PDF (2609.32600). Author names in the front matter link to the
authors' personal homepages (confirmed with the authors, 2026-10-01).

Before any push or publication, obtain the project owner's approval.
