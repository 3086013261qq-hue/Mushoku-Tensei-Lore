#!/usr/bin/env python3
"""Apply Mushoku-Tensei-Lore karma timeline tags (v0.2 default) to an extracted CCv3 JSON.

Usage:
  python tools/apply_karma_timeline_v0.2.py INPUT.json OUTPUT.json \
      --ledger timeline/working/karma-ledger.v0.2.json

The script only appends machine tags to matched `-事件...` lines. It does not rewrite
existing event prose. GLOBAL ledger rows are left for the runtime overlay.
"""
import argparse, json, re
from pathlib import Path

EVENT_RE = re.compile(r"^-事件([^:]+):\s*([^\(]+?)\s*\(")

def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--ledger", default="timeline/working/karma-ledger.v0.2.json")
    args=ap.parse_args()
    card=load(args.input)
    ledger=load(args.ledger)
    rows=[r for r in ledger["entries"] if r.get("timeline")!="GLOBAL"]
    by_timeline={}
    for r in rows:
        by_timeline.setdefault(r["timeline"], []).append(r)
    matched=set()
    timeline_count=0
    for entry in card["data"]["character_book"]["entries"]:
        comment=entry.get("comment","")
        if not comment.startswith("时间线-"):
            continue
        timeline_count += 1
        candidates=by_timeline.get(comment,[])
        if not candidates:
            continue
        out=[]
        for line in entry.get("content","").splitlines():
            m=EVENT_RE.match(line)
            if m:
                eid,title=m.group(1).strip(),m.group(2).strip()
                tags=[]
                for r in candidates:
                    if r["event"]==eid and r["title_match"] in title:
                        tags.extend(r["tags"])
                        matched.add((comment,eid,r["title_match"]))
                if tags:
                    unique=[]
                    for t in tags:
                        if t not in unique and t not in line:
                            unique.append(t)
                    if unique:
                        line += " " + " ".join(unique)
            out.append(line)
        entry["content"]="\n".join(out)
    expected={(r["timeline"],r["event"],r["title_match"]) for r in rows}
    missing=expected-matched
    if timeline_count != 46:
        raise SystemExit(f"QA FAIL: expected 46 timeline entries, got {timeline_count}")
    if missing:
        raise SystemExit("QA FAIL: unmatched ledger rows: "+repr(sorted(missing)))
    Path(args.output).write_text(json.dumps(card,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"PASS: timelines={timeline_count}, ledger_rows={len(rows)}, matched={len(matched)}, missing=0")

if __name__=="__main__":
    main()
