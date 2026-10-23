# Matchmaking rank icons

Code-drawn, no image model. These are shaded vector emblems with stylized spider anatomy, not photorealistic species illustrations.

Rank represents online matchmaking skill. EXP remains separate and unlocks abilities. These assets do not introduce rating thresholds or alter either gameplay system.

| Tier | Asset stem | Title | Finish |
| --- | --- | --- | --- |
| 1 | `wolf-spider` | Grave Stalker | Bronze |
| 2 | `huntsman-spider` | Nightmare Prowler | Silver |
| 3 | `philippine-tarantula` | Hellspawn | Copper |
| 4 | `brown-widow` | Death's Empress | Gold with garnet accent |

## Files

- `../../client/public/ranks/`: transparent SVG originals and PNG exports at 512, 256, 128 and 64 px. Unsuffixed PNGs are 512 px.
- `rank-icons-preview.png`: all four badges plus dark/light background checks at 96, 64 and 32 px.
- `build_icons.py`: reproducible SVG source; includes metadata with source and SVG hashes.
- `rendered/`: exact rasterizer outputs, metadata, hashes and portable SVG lint reports.
- `renderer-resvg.json`: passing renderer calibration.
- `export-qa.json`: passing canvas, alpha and clipping checks.

Use `/ranks/wolf-spider.svg` (and the other stems) from the game. Prefer 64 px or larger for spider detail; 32 px conveys tier primarily through silhouette and colour. Provide the rank name as accessible text when the badge is meaningful, or empty alt text when adjacent text already gives its name.

## Regeneration

Requires Python with Pillow, numpy and resvg-py 0.5.x, plus the explicitly requested codeart2d skill. No game dependencies were added. On this machine these packages are already installed in `C:/Users/chex/AppData/Local/Programs/Python/Python313/python.exe`.

1. Run `build_icons.py` from any directory.
2. For each SVG, run the skill's `scripts/svg_render.py render --svg <svg> --output-dir <new-render-directory> --backend resvg_py`. The skill intentionally refuses an existing output directory. `preview_icons.py` expects the final render folders at `art/ranks/rendered/<stem>`.
3. Run `preview_icons.py` to export the PNG sizes and review sheet. It uses Windows Segoe UI for review labels only; the icons have no font dependencies.

## Validation

The resvg calibration, four portable SVG lint checks, and export checks pass with no warnings. All four icons were reviewed together at UI sizes and the tarantula was also inspected at its native 512 px. Transparent margins and full-opacity artwork are asserted. Anti-aliasing and intermediate gradient colours are intentional.

Chrome could not run the initial calibration because its GPU process crashed in this environment. It was not used to render delivered assets; cross-browser appearance and in-game integration have not been tested. No game runtime code was changed.
