# CUA-SWE project website

A static research site: `index.html` presents the benchmark, per-domain model results
and recorded repairs; `tasks.html` explores all 105 tasks. `results.html` remains
available as a standalone results view. GitHub Pages serves the repository root.
No build step or JavaScript dependencies are required.

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
| Overview video | Byte-identical copy of the full 50-second `paper/demo_video/exports/CUA-SWE_demo_web_720p.mp4`, including the opening title and subtitle. This contains baseline and repair replays; it is not an original agent-run recording. The title-card poster is copied from `paper/demo_video/exports/poster.jpg`; `tools/prepare_media.py` copies both without trimming or re-encoding. |

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

All pages use white backgrounds with blue and cyan interaction accents.
Model comparisons follow the evaluation conditions on the homepage, before the
recorded repair episode. Results navigation links jump to that section. The homepage
uses a manually controlled repair episode and an overview video
with pause and full-screen controls. Reduced-motion preferences disable video
autoplay. Results and task filters work with keyboard controls; task URL hashes
open the corresponding original instruction.

Keep the copy short. Use real evidence as the visual focus. Avoid decorative
badges, repeated metadata rows and reconstructed agent actions. Letter Arc's
two frames show a replay defect, not a successful repair before/after pair.

`LINKS` in `assets/js/site.js` and `assets/js/tasks.js` defines external URLs.
The `paper` URL stays `null`, hiding paper links until a public preprint exists.
The research repository is currently private. Fonts load from Google Fonts
(Inter and JetBrains Mono, with Klee One only for “the interface.” in the hero);
all other assets are local.

Before any push or publication, obtain the project owner's approval.
