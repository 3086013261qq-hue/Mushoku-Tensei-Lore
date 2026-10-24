# timeline/working

当前唯一工作基线：`v0.2`。

## 当前有效构建

- 授权母卡 46 条时间线全部进入 working 构建。
- 映射规则：82 条非 GLOBAL 规则，全部精确命中，0 未命中。
- 唯一 canonical 债目（含 M20）：78 个。
- 只在原事件行尾追加机器标签，不删除、不改写母卡原剧情句子。
- 同一账目 ID 永久去重，避免动画摘要与小说详细卷重复收费。
- `TIMELINE-OVERLAY-EMPEROR_v0.1.md`：{{user}} 故事 T+3 帝皇娘降临。
- `KARMA-GLOBAL-RULES_v0.2.md`：当前唯一运行计债规则。
- `karma-ledger.v0.2.json`：当前唯一机器映射表。
- `CURVE_AUDIT_v0.2.md`：慢性因果增长曲线审计。
- `tools/apply_karma_timeline_v0.2.py`：从授权母卡 JSON 重建 tagged working JSON。

## v0.2 数值硬规则

- 所有确认特权首次取得统一 `+1`。
- `P1/P2/P3` 只表示严重度与纠正优先级，不再直接等于数值增量。
- 行为轻/中度 `+1`；重度/持续强越界 `+2`。
- 明确克制、承担、真实修正通常 `-1`。
- `OLD01` 旧世因果为条件触发的一次性 `+20`；不得开场自动灌入。

## 曲线 QA

构建实测：`PASS: timelines=46, ledger_rows=82, matched=82, missing=0`

原作自然路线、永久去重、不触发 OLD01 时：
- 第一卷约 10
- 第四卷上约 20
- 第十二卷下约 45
- 第十八卷约 61
- 第二十六卷约 71

若蛇足前约 68 时触发 `OLD01 +20`，进入约 88 的清算区，但仍不自动到100。

## 完整成品备份（ChatGPT Library）

路径：`/Mushoku-Tensei-Lore/timeline/working/`

- `ALL_46_TAGGED_v0.2.md`
  - SHA-256: `7f08d9d3850159c40fc036d995bf09e8fa087d62e2513ba6a0af83c631b58e56`
- `karma-ledger.v0.2.json`
  - SHA-256: `c5be07e73d6a1e6580e750773e823b614abc05816b4d6593d258c4ad45014352`
- `KARMA-GLOBAL-RULES_v0.2.md`
  - SHA-256: `b69db8803011c393fc57c09edef2c3454e65d3806f57383b8e0edaf4b07afc52`
- `CURVE_AUDIT_v0.2.md`
  - SHA-256: `5f55463ad642b3f0d86c2e9df805fc0a1e68764d29a1081ac9f8694e5dd34b14`
- `QA_v0.2.md`
  - SHA-256: `bf3f625f821a6a4e9abe65ddcdf2ea2e547c8d7edd416463abc95c4c46b7e310`
- `apply_karma_timeline_v0.2.py`
  - SHA-256: `e563500a556600d26d65e879c02f35076cd9461d054ce68dc93271b96ee8ac8d`
- `无职转生_沙盒_因果标注_working_v0.2.json`：已备份于 `/Mushoku-Tensei-Lore/source/working/`。

## 历史版本

`v0.1` 保留用于审计构建过程，但不得作为后续运行规则来源。

## 禁止事项

- 不得直接覆盖授权母卡。
- 不得删除账目 ID 去重机制。
- 不得恢复“特权只观察、不计因果”的旧口径。
- 不得恢复 `P2=+3 / P3=+5` 旧实时权重。
- 不得把 `T22` 旧世回流候选改成开场一次性灌满；回流必须由条件触发。
