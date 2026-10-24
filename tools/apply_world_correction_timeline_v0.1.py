#!/usr/bin/env python3
import json, sys
from pathlib import Path

if len(sys.argv) != 4:
    print('usage: apply_world_correction_timeline_v0.1.py <working_card_v0.2.json> <world-correction-ledger.v0.1.json> <out.json>')
    raise SystemExit(2)
card_path, ledger_path, out_path = map(Path, sys.argv[1:])
card=json.loads(card_path.read_text())
ledger=json.loads(ledger_path.read_text())['entries']
entries=card['data']['character_book']['entries']
by_comment={e.get('comment'):e for e in entries}
matched=[]
for row in ledger:
    ent=by_comment.get(row['timeline'])
    if not ent:
        raise RuntimeError(f"timeline not found: {row['timeline']}")
    lines=ent.get('content','').splitlines()
    hits=[]
    for i,line in enumerate(lines):
        if line.startswith('-'+row['event']+':') and row['anchor'] in line:
            hits.append(i)
    if len(hits)!=1:
        raise RuntimeError(f"expected exactly 1 hit for {row['id']} in {row['timeline']}, got {len(hits)}")
    i=hits[0]
    tag=f"[纠正:{row['id']}/+{row['delta']}/" + '+'.join(row['type']) + "]"
    if row['id'] not in lines[i]:
        lines[i] += ' ' + tag
    ent['content']='\n'.join(lines)
    matched.append(row['id'])
card['data']['character_version']='5.3.0-karma-correction-working-v0.3'
Path(out_path).write_text(json.dumps(card,ensure_ascii=False,indent=2))
print(f'PASS: correction_rows={len(ledger)}, matched={len(matched)}, missing=0, unique_ids={len(set(matched))}')
