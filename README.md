# CUA-SWE project website

Static site for the CUA-SWE benchmark: `index.html` (narrative), `tasks.html` (task explorer),
`assets/`, `data/`. No build step; GitHub Pages serves the repository root. To preview locally:

```bash
python3 -m http.server 8000
```

The research repository (task bundles, verifiers, evaluation pipeline) is separate; this
repository holds only the display copy of its data and media.

## Where the content comes from

| Content | Source |
| --- | --- |
| Task list, instructions, budgets, families | `tools/build_data.py` reads `dataset/registry.json`, the four domain manifests, every `task.yaml`, Mobile `INSTRUCTION.md`, and the Web-36 and Mobile-20 release evaluation summaries. Rerun it after a registry change: `python3 tools/build_data.py --root <cua-swe checkout>` |
| Results table and paired chart | `assets/js/site.js` (`TABLE1`, `PAIRED`). Numbers are Table 1 of the paper; the paired chart is computed from the per-domain success counts of the same evaluation. |
| Vector Relay episode | `assets/js/site.js` (`EPISODE`), transcribed from `paper/figure2_assets/cases/01_vector_relay` (frame manifest, agent messages, patch, shell output, verifier report). |
| Screenshots and video | `tools/prepare_media.py --root <cua-swe checkout>` copies retained frames from `paper/figure1_assets`, `paper/figure2_assets` and `paper/demo_video`; `assets/media/manifest.json` records the source and hash of each file. |

The current data was built from the `origin/main` snapshot `2d86f0e1` (canonical 105 tasks:
36 Web, 29 Game, 20 DevOps, 20 Mobile). Both tools take `--root` (or `CUA_SWE_ROOT`) pointing at a
checkout at that revision or later.

## Before publishing

## Links

`LINKS` at the top of `assets/js/site.js` and `assets/js/tasks.js` holds the external URLs.
`paper` is `null` until the preprint is public, which hides the paper buttons. `code` points at the
research repository and `viewer` at the public data viewer.

Fonts load from Google Fonts (Inter, JetBrains Mono). Everything else is self-contained.
