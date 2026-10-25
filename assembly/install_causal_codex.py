#!/usr/bin/env python3
import argparse, copy, hashlib, json
from pathlib import Path

SCRIPT_IDS = {"causal-codex-mvu-core", "causal-codex-zod", "causal-codex-runtime"}
REGEX_IDS = {"causal-codex-hide-update", "causal-codex-hide-placeholder"}
TECH_COMMENTS = {
    "[mvu_update]因果法典变量更新规则",
    "[mvu_update]因果法典变量输出格式",
    "变量列表｜因果法典",
    "[initvar]因果法典MVU变量初始化勿开",
}

UPDATE_RULES = """变量更新规则:\n  _causal_codex: 全部只读，仅由因果法典MVU脚本维护；禁止模型对其任何子路径新增、替换、移除或移动。\n  causality: 每轮仍按既有runtime v0.2输出唯一<causality>；MVU只读取，不重算伦理。\n  pending: 若_pending_death_trigger已有锁定死法，正文仅在合理场景真实发生后确认死亡；不能仅因抽到死亡签就宣告死亡。\n  revive: 若_revive_pending非null，下一次有效<causality>继承“鲁迪生死: 存活｜死法: 无”，但保留因果、纠正、RT、关系、历史与场景后果。\n"""

OUTPUT_FORMAT = """本模块没有模型可写机械字段；严禁对_causal_codex输出JSONPatch。\n如咩咩预设要求变量更新块，本模块允许的默认输出为：\n<UpdateVariable>\n<Analysis>No writable causal-codex fields.</Analysis>\n<JSONPatch>[]</JSONPatch>\n</UpdateVariable>\n宿主未来若新增其他可写变量，可在同一唯一UpdateVariable协议中维护它们；不得为因果法典再开第二套协议。\n"""

VARIABLE_LIST = """---\n<status_current_variable>\n{{format_message_variable::stat_data}}\n</status_current_variable>\n\n- 不在正文里输出 <status_current_variable>，它只用于读取当前变量。\n- `_causal_codex` 为模型可见只读机械事实，禁止模型修改。\n- 因果/纠正真值继续来自每轮唯一 `<causality>`，不得在 stat_data 建第二份伦理真值。\n"""


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def load_json(path: Path):
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def dump_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8', newline='\n') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write('\n')


def entry_extensions(position: int, depth: int, display_index: int):
    return {
        "selectiveLogic": 0,
        "position": position,
        "depth": depth,
        "role": 0,
        "match_whole_words": True,
        "probability": 100,
        "useProbability": True,
        "sticky": 0,
        "cooldown": 0,
        "delay": 0,
        "exclude_recursion": True,
        "prevent_recursion": True,
        "delay_until_recursion": False,
        "group": "",
        "group_override": False,
        "group_weight": 100,
        "use_group_scoring": False,
        "scan_depth": 2,
        "case_sensitive": False,
        "automation_id": "",
        "vectorized": False,
        "display_index": display_index,
        "outlet_name": "",
        "match_persona_description": False,
        "match_character_description": False,
        "match_character_personality": False,
        "match_character_depth_prompt": False,
        "match_scenario": False,
        "match_creator_notes": False,
        "triggers": [],
        "ignore_budget": False,
    }


def tech_entry(entry_id, insertion_order, comment, content, *, enabled, position, depth):
    return {
        "id": entry_id,
        "keys": [],
        "secondary_keys": [],
        "comment": comment,
        "content": content.rstrip() + "\n",
        "constant": True,
        "selective": False,
        "insertion_order": insertion_order,
        "enabled": enabled,
        "position": position,
        "extensions": entry_extensions(4 if position == "at_depth" else 1, depth, entry_id),
        "use_regex": True,
    }


def merge_by_id(existing, incoming, owned_ids, label):
    incoming_map = {x.get('id'): x for x in incoming}
    if set(incoming_map) != owned_ids:
        raise SystemExit(f"{label}: expected IDs {sorted(owned_ids)}, got {sorted(incoming_map)}")
    result = [x for x in existing if x.get('id') not in owned_ids]
    result.extend(copy.deepcopy(incoming_map[i]) for i in [x.get('id') for x in incoming])
    return result


def install(base, module_dir: Path):
    if base.get('spec') != 'chara_card_v3' or str(base.get('spec_version')) != '3.0':
        raise SystemExit('Input is not chara_card_v3 spec 3.0')
    data = base.get('data')
    if not isinstance(data, dict):
        raise SystemExit('Missing data object')
    book = data.get('character_book', {}).get('entries')
    if not isinstance(book, list):
        raise SystemExit('Missing data.character_book.entries')

    scripts = load_json(module_dir / 'dist' / 'tavern-helper-scripts.json')
    regexes = load_json(module_dir / 'dist' / 'regex.json')
    initvar = (module_dir / 'src' / 'initvar.yaml').read_text(encoding='utf-8').rstrip() + '\n'

    ext = data.setdefault('extensions', {})
    th = ext.setdefault('tavern_helper', {})
    host_scripts = th.setdefault('scripts', [])
    th.setdefault('variables', {})

    th['scripts'] = merge_by_id(host_scripts, scripts, SCRIPT_IDS, 'tavern_helper.scripts')
    ext['regex_scripts'] = merge_by_id(ext.setdefault('regex_scripts', []), regexes, REGEX_IDS, 'regex_scripts')

    book[:] = [e for e in book if e.get('comment') not in TECH_COMMENTS]
    max_id = max((int(e.get('id', -1)) for e in book), default=-1)
    max_ins = max((int(e.get('insertion_order', 0)) for e in book), default=0)

    tech = [
        tech_entry(max_id+1, max_ins+4, '[mvu_update]因果法典变量更新规则', UPDATE_RULES,
                   enabled=True, position='at_depth', depth=0),
        tech_entry(max_id+2, max_ins+3, '[mvu_update]因果法典变量输出格式', OUTPUT_FORMAT,
                   enabled=True, position='at_depth', depth=0),
        tech_entry(max_id+3, max_ins+2, '变量列表｜因果法典', VARIABLE_LIST,
                   enabled=True, position='at_depth', depth=0),
        tech_entry(max_id+4, max_ins+1, '[initvar]因果法典MVU变量初始化勿开', initvar,
                   enabled=False, position='after_char', depth=4),
    ]
    book.extend(tech)
    return base


def canonical(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def verify(before, after):
    b_entries = before['data']['character_book']['entries']
    a_entries = after['data']['character_book']['entries']
    b_business = [e for e in b_entries if e.get('comment') not in TECH_COMMENTS]
    a_business = [e for e in a_entries if e.get('comment') not in TECH_COMMENTS]
    if canonical(b_business) != canonical(a_business):
        raise AssertionError('Existing non-installer worldbook entries changed')
    tech = [e for e in a_entries if e.get('comment') in TECH_COMMENTS]
    if len(tech) != 4:
        raise AssertionError(f'Expected 4 technical entries, got {len(tech)}')
    if sum(1 for e in tech if e['comment'].startswith('[initvar]') and not e['enabled']) != 1:
        raise AssertionError('initvar entry missing/incorrect')
    scripts = after['data']['extensions']['tavern_helper']['scripts']
    regexes = after['data']['extensions']['regex_scripts']
    if not SCRIPT_IDS.issubset({x.get('id') for x in scripts}):
        raise AssertionError('Missing causal-codex scripts')
    if not REGEX_IDS.issubset({x.get('id') for x in regexes}):
        raise AssertionError('Missing causal-codex regexes')
    return {
        'original_entries_preserved': len(b_business),
        'technical_entries': len(tech),
        'total_entries': len(a_entries),
        'script_ids': sorted(SCRIPT_IDS),
        'regex_ids': sorted(REGEX_IDS),
    }


def main():
    ap = argparse.ArgumentParser(description='Install standalone Causal Codex MVU into an existing CCv3 JSON without rewriting business worldbook entries.')
    ap.add_argument('input', type=Path)
    ap.add_argument('output', type=Path)
    ap.add_argument('--module-dir', type=Path, default=Path('modules/causal-codex'))
    args = ap.parse_args()

    before = load_json(args.input)
    after = install(copy.deepcopy(before), args.module_dir)
    report = verify(before, after)
    dump_json(args.output, after)
    report['input_sha256'] = sha256_file(args.input)
    report['output_sha256'] = sha256_file(args.output)
    report['output'] = str(args.output)
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
