# timeline/working

当前唯一工作基线：`v0.3`。

## 当前有效构建

- 授权母卡 46 条时间线全部进入 working 构建。
- 因果映射：82 条非 GLOBAL 规则，全部精确命中，0 未命中。
- 世界纠正映射：25 个唯一 `CORR-*` 锚点，全部精确命中，0 未命中。
- 只在原事件行尾追加机器标签，不删除、不改写母卡原剧情句子。
- 同一账目 ID 永久去重。
- `TIMELINE-OVERLAY-EMPEROR_v0.1.md`：{{user}} 故事 T+3 帝皇娘降临。
- `KARMA-GLOBAL-RULES_v0.2.md`：当前因果计债规则。
- `karma-ledger.v0.2.json`：当前因果机器映射表。
- `WORLD-CORRECTION-RULES_v0.1.md`：当前世界纠正度时间线规则。
- `world-correction-ledger.v0.1.json`：当前纠正机器映射表。
- `WORLD-CORRECTION-CURVE_v0.1.md`：原作自然路线纠正曲线审计。
- `tools/apply_karma_timeline_v0.2.py`：母卡 → 因果 tagged v0.2。
- `tools/apply_world_correction_timeline_v0.1.py`：因果 v0.2 → 因果+纠正 v0.3。

## 因果硬规则

- 所有确认特权首次取得统一 `+1`。
- `P1/P2/P3` 只表示严重度与纠正优先级，不直接等于数值增量。
- 行为轻/中度 `+1`；重度/持续强越界 `+2`。
- 明确克制、承担、真实修正通常 `-1`。
- `OLD01` 旧世因果为条件触发的一次性 `+20`；不得开场自动灌入。

## 世界纠正硬规则

- 绝对范围 `0～100`。
- 只有帝皇 `T+3` 之后实际发生的事件可结算，不允许历史倒灌。
- `+1`：局部边界、独立选择、承担、真实后果。
- `+2`：结构性纠正、权力滥用被处理、长期依附被拆开、旧世责任开始回收。
- `+3`：神/命运/转生兜底机制被实质限制并形成稳定约束。
- 单纯受苦、失恋、挨打、死亡不加纠正。
- 新增因果债不会自动降低纠正；只有已经修复的结构发生回退，纠正度才可 `-1/-2`。

## 曲线 QA

### 因果
原作自然路线、不触发 OLD01 时：
- 第一卷约 10
- 第四卷上约 20
- 第十二卷下约 45
- 第十八卷约 61
- 第二十六卷约 71

若蛇足前约 68 时触发 `OLD01 +20`，进入约 88 清算区。

### 世界纠正
从第一卷开始、帝皇 T+3 后原作基本照常发生时：
- 唯一固定纠正锚点：25
- 固定时间线纠正总量：约 28

这表示原作存在局部边界和反省，但没有系统性拆除主角特权；40 以上主要应依赖魔改正文与帝皇介入后的真实纠正。

## QA

- karma: `PASS: timelines=46, ledger_rows=82, matched=82, missing=0`
- correction: `PASS: correction_rows=25, matched=25, missing=0, unique_ids=25`

## 完整成品备份（ChatGPT Library）

路径：`/Mushoku-Tensei-Lore/timeline/working/`

- `ALL_46_TAGGED_v0.3.md`
  - SHA-256: `15dace7bd2810ebd83a3a3295d3fe49fc0148043bed9fb907e6e64ccb4af95ec`
- `world-correction-ledger.v0.1.json`
  - SHA-256: `1b90646f597a1422c7db58a9f8b302c14f77415e6d4defe560803b70177437e7`
- `WORLD-CORRECTION-RULES_v0.1.md`
  - SHA-256: `b4fdbfc8a017f47fdd39a4b63c0172286693fa597d4f65b43ebb47b4c3b6c832`
- `WORLD-CORRECTION-CURVE_v0.1.md`
  - SHA-256: `4e09e37b96287863ed07876caef3f658aee46ca5143b649537dfd6e76beefbba`
- `QA_WORLD_CORRECTION_v0.1.md`
  - SHA-256: `ad75abd00aeaaae52c8b965371f312efb0bdb452159f80e5c74d09691f7ce3dc`
- `apply_world_correction_timeline_v0.1.py`
  - SHA-256: `587456a23336abb1c352a6b470502d1663d67ab8708055748d924097d38c6c41`
- `无职转生_沙盒_因果纠正_working_v0.3.json`
  - SHA-256: `b832e9257caf367aa44afa2fa69641941c64a0ec6b2c199059136b23225a5a7d`

## 历史版本

- `v0.1`：首版因果映射。
- `v0.2`：慢性因果曲线。
- `v0.3`：加入时间线世界纠正度，为当前唯一基线。

## 禁止事项

- 不得直接覆盖授权母卡。
- 不得删除因果或纠正账目 ID 去重机制。
- 不得恢复“特权只观察、不计因果”的旧口径。
- 不得恢复 `P2=+3 / P3=+5` 旧实时权重。
- 不得把 `T22` 旧世回流候选改成开场自动灌满。
- 不得把“鲁迪受苦”直接等同于世界纠正。
- 不得回填帝皇 T+3 之前已经发生的纠正历史。
