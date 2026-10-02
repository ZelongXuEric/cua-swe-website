# CUA-SWE project website

A static research site in the style of an academic project page: `index.html` has the paper
front matter (title, authors, buttons), an overview with one before/after task per domain,
results (inline-SVG grouped bar charts, an efficiency scatter and the four-domain table), a
recorded repair example, the four domains, analysis (paired gains, four case figures, two
failures), evaluation (pipeline figure, the three verifier checks, the Captain Callisto task
figure) and the citation. `tasks.html` explores all 105 tasks; `results.html` redirects to
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
| Paper figures | `assets/media/figures/*.png`, rendered by `tools/render_figures.py` (needs `pypdfium2`) from the **arXiv e-print** figures stored at `paper/arxiv-2609.32600v1/figures` in the research checkout (source dated 2026-09-29). The older Overleaf snapshot under `paper/overleaf` (2026-09-23) has outdated figures and must not be used. Rendered: Figure 1 overview, Figure 2 pipeline, Figures 3–4 task examples (Tasks), Figure 5 (reference validation, under Evaluation), Figure 6a, Figure 20 paired gains, Figures 28–31 repair cases. The appendix's task-construction figure (Figure 8) is deliberately not used. Sources and hashes are in `assets/media/figures/manifest.json`. |
| Vector Relay repair episode | Retained screenshots, patch, shell outputs and verifier report in `paper/figure2_assets/cases/01_vector_relay`. The five steps are a selected excerpt of one recorded attempt. |
| Web replay (`#examples`) | `tools/build_episode.py --bundle <run>/gpt6-cua --curation tools/episodes/fabric-nested-05.json`. `<run>` is the redacted EFS export of `runs/candidate-05/` (GPT-6 Astra, plus GPT-5.6 Sol and Claude Opus 5 for the comparison line), kept outside this repository. This is the paper's Table 8 attempt; the patch view keeps `src/app.mjs` only. |
| Minesweeper replay (`#examples`) | `tools/build_episode.py --bundle <dir> --curation tools/episodes/minesweeper-002.json`, where `<dir>` is `media/source/agent/game-cua/gameqa.minesweeper-delayed-loss-episode-identity.002` from the public `cua-swe-viewer` repository. Event text and frames are verbatim; only stage titles and one-line summaries in the curation file are editorial. It is a GPT-5.6 Sol construction trial (`cua-03`), not a Table 8 attempt. `node tools/check_replay.mjs` checks the timeline. |
| Other screenshots | `tools/prepare_media.py --root <research-checkout>` copies retained frames from `paper/figure1_assets`, `paper/figure2_assets` and `paper/demo_video`. `assets/media/manifest.json` records file sources and hashes. |
| Overview strip | `assets/media/hero/*`: matched baseline/repaired pairs, one per domain, produced by `tools/prepare_media.py` from `paper/figure1_assets` (Allocation Ring and Counter Order reference replays), frames 3 and 16 of the recorded GPT-5.6 Sol Hextris attempt in the public `cua-swe-viewer` repository (set `CUA_SWE_VIEWER`) and `paper/demo_video/assets/media` (Mural Desk baseline and reference plan). Crop boxes are recorded in `assets/media/manifest.json`. |
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
labels on the overall panel. The conditions are named Code-only (Coding / CLI) and Hybrid
(Computer use + Coding / CLI), following the paper. Figures open in a lightbox. The recorded
repair episode is manual and keyboard-accessible; task URL hashes open the corresponding
original instruction.

Keep the copy short and factual. Use real evidence as the visual focus. Avoid decorative
badges, repeated metadata rows and reconstructed agent actions.

`LINKS` in `assets/js/site.js` and `assets/js/tasks.js` defines external URLs, including
the arXiv abstract and PDF (2609.32600). Author names in the front matter link to the
authors' personal homepages (confirmed with the authors, 2026-10-01).

Before any push or publication, obtain the project owner's approval.
