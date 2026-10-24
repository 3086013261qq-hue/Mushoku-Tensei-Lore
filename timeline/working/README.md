# timeline/working

当前工作基线：`v0.1`。

## 已完成

- 授权母卡 46 条时间线全部进入 working 构建。
- 映射规则：82 条（包含动画季摘要的重复覆盖），全部精确命中，0 未命中。
- 只在原事件行尾追加机器标签，不删除、不改写母卡原剧情句子。
- 同一账目 ID 永久去重，避免动画摘要与小说详细卷重复收费。
- `TIMELINE-OVERLAY-EMPEROR_v0.1.md`：{{user}}故事 T+3 帝皇娘降临。
- `KARMA-GLOBAL-RULES_v0.1.md`：行为因果 / 特权因果 / 去重 / 长期状态 / 纠正规则。
- `karma-ledger.v0.1.json`：可重建的唯一机器映射表。
- `tools/apply_karma_timeline.py`：从授权母卡 JSON 重建 tagged working JSON。

## QA

构建实测：`PASS: timelines=46, ledger_rows=82, matched=82, missing=0`

## 完整成品备份（ChatGPT Library）

路径：`/Mushoku-Tensei-Lore/timeline/working/`

- `ALL_46_TAGGED_v0.1.md`
  - SHA-256: `9c171eebddc1b215a1c733c39ba3cd1c6b8b40a48e9eceadf856e71aefce3eeb`
- `karma-ledger.v0.1.json`
  - SHA-256: `389972ffd9df446d22b93e2b37648f166b6b7620557e056a9e095eac960b78ef`
- `无职转生_沙盒_因果标注_working_v0.1.json`
  - SHA-256: `6bf52189bbdc1b244fd98877b666489920d16173bdbc1270c7e4100f82b20b6f`
- `TIMELINE-OVERLAY-EMPEROR_v0.1.md`
  - SHA-256: `745a437ccf669dc8e3def164e115264881f83cadff15550eb52bbd2da6f358f2`
- `KARMA-GLOBAL-RULES_v0.1.md`
  - SHA-256: `945827f282a6c215f6f7185b78a98dc672238bcb1530aa00b6f1af90afe97a15`

## 禁止事项

- 不得直接覆盖授权母卡。
- 不得删除账目 ID 去重机制。
- 不得把旧版“特权只观察、不计因果”口径恢复回来。
- 不得把 `T22` 旧世回流候选改成开场一次性灌满；回流必须由后续条件触发。
