"""Pack the codeart2d rig clips into a transparent, fixed-cell spritesheet."""

import json
import hashlib
from pathlib import Path

from PIL import Image


HERE = Path(__file__).resolve().parent
RENDER = HERE / "render-v1"
source = json.loads((RENDER / "clips.json").read_text(encoding="utf-8"))
files = {frame["name"]: RENDER / frame["file"] for frame in source["frames"]}
clips = source["clips"]
first = Image.open(next(iter(files.values()))).convert("RGBA")
width, height = first.size
columns = max(len(clip["frames"]) for clip in clips.values())
sheet = Image.new("RGBA", (columns * width, len(clips) * height))
manifest = {
    "art_source": "code",
    "image": "spider-sheet.png",
    "frame_size": [width, height],
    "anchor_px": source["anchor_px"],
    "clips": {},
}

for row, (name, clip) in enumerate(clips.items()):
    cells = []
    for column, frame_name in enumerate(clip["frames"]):
        frame = Image.open(files[frame_name]).convert("RGBA")
        assert frame.size == (width, height), frame_name
        x, y = column * width, row * height
        sheet.alpha_composite(frame, (x, y))
        cells.append([x, y, width, height])
    manifest["clips"][name] = {
        "frames": cells,
        "duration_ms": clip["duration_ms"],
        "loop": clip["loop"],
        "events": clip.get("events", []),
        **({"stride_px_per_frame": clip["stride_px_per_frame"]} if "stride_px_per_frame" in clip else {}),
    }

for name, clip in manifest["clips"].items():
    for rect, frame_name in zip(clip["frames"], clips[name]["frames"]):
        assert sheet.crop((rect[0], rect[1], rect[0] + width, rect[1] + height)).tobytes() == Image.open(files[frame_name]).convert("RGBA").tobytes()

sheet.save(HERE / "spider-sheet.png")
(HERE / "spider-sheet.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
render_meta = json.loads((RENDER / "codeart-meta.json").read_text(encoding="utf-8"))
render_meta["generator"] = "codeart2d/rig_animate.py + pack_sheet.py"
render_meta["outputs"] = [
    {"path": name, "sha256": hashlib.sha256((HERE / name).read_bytes()).hexdigest(), "bytes": (HERE / name).stat().st_size}
    for name in ("spider-sheet.png", "spider-sheet.json")
]
(HERE / "codeart-meta.json").write_text(json.dumps(render_meta, indent=2) + "\n", encoding="utf-8")
print(f"packed {sum(len(c['frames']) for c in clips.values())} frames: {sheet.width}x{sheet.height}")
