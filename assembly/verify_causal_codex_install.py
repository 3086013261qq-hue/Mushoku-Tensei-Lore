#!/usr/bin/env python3
import argparse, json
from pathlib import Path

SCRIPT_IDS={"causal-codex-mvu-core","causal-codex-zod","causal-codex-runtime"}
REGEX_IDS={"causal-codex-hide-update","causal-codex-hide-placeholder"}
TECH={"[mvu_update]因果法典变量更新规则","[mvu_update]因果法典变量输出格式","变量列表｜因果法典","[initvar]因果法典MVU变量初始化勿开"}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('json_file',type=Path); args=ap.parse_args()
    data=json.loads(args.json_file.read_text(encoding='utf-8'))
    assert data.get('spec')=='chara_card_v3' and str(data.get('spec_version'))=='3.0'
    d=data['data']; book=d['character_book']['entries']; ext=d['extensions']
    scripts=ext['tavern_helper']['scripts']; regexes=ext['regex_scripts']
    assert SCRIPT_IDS.issubset({x.get('id') for x in scripts})
    assert REGEX_IDS.issubset({x.get('id') for x in regexes})
    tech=[e for e in book if e.get('comment') in TECH]
    assert len(tech)==4
    init=[e for e in tech if e['comment'].startswith('[initvar]')]
    assert len(init)==1 and init[0]['enabled'] is False and init[0]['position']=='after_char'
    assert init[0]['content'].lstrip().startswith('_causal_codex:') and 'stat_data:' not in init[0]['content'].splitlines()[0]
    var=[e for e in tech if e['comment']=='变量列表｜因果法典'][0]
    assert '{{format_message_variable::stat_data}}' in var['content']
    print(json.dumps({'PASS':True,'entries':len(book),'scripts':len(scripts),'regexes':len(regexes),'technical_entries':len(tech)},ensure_ascii=False,indent=2))
if __name__=='__main__': main()
