# Spider spritesheet

Code-drawn, no image model. The rig follows the current amber, striped side-view spider in `client/src/gb.ts`.

- `spider-sheet.png`: transparent 2304 × 1792 atlas, eight rows and at most eight 288 × 224 cells per row.
- `spider-sheet.json`: clip rectangles in playback order, frame timing, events, and the common anchor at `(128, 160)`.
- Rows: idle, move right, light attack, heavy attack, block, block break, parry, climb.
- `spider.rig.svg` and `spider.anim.json`: editable source. `pack_sheet.py` rebuilds the atlas from `render-v3/frames`.
- `rig-report.json`: strict rig QA. Regenerating also creates action review sheets under `render-v3/review/`.

To regenerate frames, run `codeart2d/scripts/rig_animate.py` with `--rig art/spider-spritesheet/spider.rig.svg --anim art/spider-spritesheet/spider.anim.json --output-dir art/spider-spritesheet/render-v3 --route vector --zoom 2 --build-clips --strict-qc`, then run `python art/spider-spritesheet/pack_sheet.py`. The game uses this atlas for battle actions and menu previews; spider SVG artwork has been removed from those views.
