# CUA-SWE project website

A static research site: `index.html` presents the benchmark (hero with a four-domain
baseline/repaired collage, the two evaluation conditions, per-domain model results, a
recorded repair, the four domains, the repair contract behind verification, and paper
resources); `tasks.html` explores all 105 tasks. `results.html` remains available as a
standalone results view. GitHub Pages serves the repository root. No build step or
JavaScript dependencies are required.

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
| Per-domain pass@1 results | `TABLE1` in `assets/js/site.js`, transcribed from `paper/evaluation/final-evaluation-report.md` (September 24, 2026). On the homepage and `results.html`, the domain buttons switch the table and comparison plot together. |
| Vector Relay repair episode | Retained screenshots, patch, shell outputs and verifier report in `paper/figure2_assets/cases/01_vector_relay`. The five steps are a selected excerpt of one recorded attempt. |
| Other screenshots | `tools/prepare_media.py --root <research-checkout>` copies retained frames from `paper/figure1_assets`, `paper/figure2_assets` and `paper/demo_video`. `assets/media/manifest.json` records file sources and hashes. |
| Hero collage | `assets/media/hero/*.webp`: matched baseline/repaired pairs, one per domain, produced by `tools/prepare_media.py` from `paper/figure1_assets` (Allocation Ring and Counter Order reference replays), `paper/figure2_assets` (Vector Relay screenshots 3 and 15 from the recorded GPT-5.6 Sol attempt) and `paper/demo_video/assets/media` (Mural Desk baseline and reference plan). Crop boxes are recorded in `assets/media/manifest.json`. The page cycles through the repaired states; tiles can also be toggled by hand. |
| Overview video | Byte-identical copy of the full 50-second `paper/demo_video/exports/CUA-SWE_demo_web_720p.mp4`, including the opening title and subtitle, opened from the hero in a dialog rather than autoplaying. This contains baseline and repair replays; it is not an original agent-run recording. The title-card poster is copied from `paper/demo_video/exports/poster.jpg`; `tools/prepare_media.py` copies both without trimming or re-encoding. |

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

All pages use white backgrounds with blue and cyan interaction accents. Blue
(`--gui`) marks the Hybrid condition and cyan (`--code`) marks Code-only wherever the
two are compared. The conditions are named Code-only (Coding / CLI) and Hybrid
(Computer use + Coding / CLI), following the paper. Homepage order: hero and
statistics, the two conditions, per-domain results, the recorded repair episode, the
four domains, the repair contract (task, regression and permitted-change checks, plus
the buggy / incomplete / reference validation of every test), recorded cases, and paper
resources. The hero collage stops cycling under reduced-motion preferences and when
scrolled out of view. Results and task filters work with keyboard controls; task URL
hashes open the corresponding original instruction.

Keep the copy short. Use real evidence as the visual focus. Avoid decorative
badges, repeated metadata rows and reconstructed agent actions. Letter Arc's
two frames show a replay defect, not a successful repair before/after pair.

`LINKS` in `assets/js/site.js` and `assets/js/tasks.js` defines external URLs,
including the arXiv abstract and PDF (2609.32600). Fonts load from Google Fonts
(Inter and JetBrains Mono); all other assets are local.

Before any push or publication, obtain the project owner's approval.
