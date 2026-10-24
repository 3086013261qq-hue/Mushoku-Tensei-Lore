#!/usr/bin/env python3
"""Apply realtime causality/correction layer to the v0.3 working card.

Usage:
  python tools/apply_realtime_layer_v0.1.py INPUT_V03.json OUTPUT_V04.json
"""
import argparse, copy, json
from pathlib import Path

BASELINES = "timeline/working/opening-karma-baselines.v0.1.json"
RUNTIME_SOURCE = "worldbook/rules/实时因果与世界纠正_v0.1.md"


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--baselines", default=BASELINES)
    ap.add_argument("--runtime-source", default=RUNTIME_SOURCE)
    args = ap.parse_args()

    card = load_json(args.input)
    baselines = load_json(args.baselines)["timelines"]
    runtime_md = Path(args.runtime_source).read_text(encoding="utf-8")
    marker = "{{setvar::affinity_format::"
    if marker not in runtime_md:
        raise SystemExit("QA FAIL: runtime source missing affinity_format")
    runtime_content = runtime_md[runtime_md.index(marker):].strip()

    timelines = [e for e in card["data"]["character_book"]["entries"]
                 if e.get("comment", "").startswith("时间线-")]
    if len(timelines) != 46:
        raise SystemExit(f"QA FAIL: expected 46 timelines, got {len(timelines)}")
    if set(e["comment"] for e in timelines) != set(baselines):
        raise SystemExit("QA FAIL: timeline/baseline key mismatch")

    for e in timelines:
        c = e["comment"]
        if "RUNTIME_BASELINE:" in e.get("content", ""):
            raise SystemExit("QA FAIL: duplicate runtime baseline: " + c)
        base = baselines[c]["karma_base"]
        line = f"<!-- RUNTIME_BASELINE: TIMELINE={c}; KARMA_BASE={base}; CORRECTION_BASE=0 -->"
        content = e.get("content", "")
        if not content.startswith("<world_timeline>"):
            raise SystemExit("QA FAIL: invalid world_timeline root: " + c)
        e["content"] = content.replace("<world_timeline>", "<world_timeline>\n" + line, 1)

    entries = card["data"]["character_book"]["entries"]
    if any("affinity_format" in e.get("content", "") for e in entries):
        raise SystemExit("QA FAIL: card already defines affinity_format")

    status_idx = next(i for i,e in enumerate(entries) if e.get("comment") == "状态栏-默认")
    template = copy.deepcopy(entries[status_idx])
    new_id = max(e.get("id", 0) for e in entries) + 1
    template.update({
        "id": new_id,
        "comment": "实时因果与世界纠正-咩咩affinity槽",
        "content": runtime_content,
        "insertion_order": template.get("insertion_order", 182) + 1,
        "enabled": True,
        "constant": True,
        "selective": True,
    })
    if isinstance(template.get("extensions"), dict):
        template["extensions"]["display_index"] = new_id
    entries.insert(status_idx + 1, template)

    Path(args.output).write_text(json.dumps(card, ensure_ascii=False, indent=2), encoding="utf-8")

    out = load_json(args.output)
    out_t = [e for e in out["data"]["character_book"]["entries"] if e.get("comment", "").startswith("时间线-")]
    baseline_count = sum(e.get("content", "").count("RUNTIME_BASELINE:") for e in out_t)
    runtime_count = sum(e.get("comment") == "实时因果与世界纠正-咩咩affinity槽" for e in out["data"]["character_book"]["entries"])
    affinity_defs = sum("affinity_format" in e.get("content", "") for e in out["data"]["character_book"]["entries"])
    if (len(out_t), baseline_count, runtime_count, affinity_defs) != (46, 46, 1, 1):
        raise SystemExit(f"QA FAIL: timelines={len(out_t)} baselines={baseline_count} runtime={runtime_count} affinity={affinity_defs}")
    print("PASS: timelines=46 baseline_markers=46 runtime_entries=1 affinity_defs=1")


if __name__ == "__main__":
    main()
