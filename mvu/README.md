# mvu

当前 MVU 候选基线：`v0.5-mvu-alpha`。

本项目 MVU 坚持轻量化，只负责四件事：

1. 展示鲁迪因果值。
2. 展示世界纠正度。
3. 展示/收藏“鲁迪的一百种死亡方式”（仅短名，不展开死亡描写）。
4. 提供“一键复活鲁迪”。

## 唯一事实源

MVU **只读取每回合输出的 `<causality>...</causality>`**：

- `⚖️鲁迪因果`
- `🌍世界纠正`
- `💀鲁迪生死`
- 隐藏 RT 字段中的 `KSET / CSET / OLD01 / CORR_ACTIVE`

实时计算继续复用咩咩预设成熟的 `affinity_format` 输出槽：本回合判定 → Δ → 继承旧值 → 0～100 阈值拦截 → 输出新值。

**MVU 不得保存因果/纠正副本，也不得重新计算时间线标签或正文伦理判断。**

## v0.5 alpha 设计

视觉主题：`帝国审判终端`。

- 黑金主体。
- 因果条：暗红。
- 世界纠正条：冷蓝。
- 顶部轻状态：帝皇监察 / 账目去重 / 旧世回流。
- 中部双进度卡：数值、阶段、本回合Δ与来源。
- 底部：`百死图鉴` + `一键复活鲁迪`。
- 百死图鉴使用折叠抽屉，100个短名，已发现词条高亮。
- 手机窄屏自动单列。

完整设计：`001_因果审判终端设计_v0.1.md`。
固定词表：`death-catalog.v0.1.json`。

## 允许的 MVU 机械派生态

`stat_data` 只允许保存：

- `mushoku_ui.death_seen`
- `mushoku_ui.revive_count`
- `mushoku_ui.revive_pending`
- `mushoku_ui.last_death`

这些字段只服务于图鉴与按钮交互，不是真相源。

## 一键复活

- 鲁迪存活时禁用。
- 鲁迪死亡时可点。
- 点击后只写 `revive_pending=true`、`revive_count+1`，并向 `#send_textarea` 填入复活行动。
- **不自动发送。**
- 复活不得清空因果、世界纠正、人物关系、KSET/CSET、OLD01、死亡图鉴，也不得回滚已发生剧情。

## 当前候选构建

完整候选卡已备份在 ChatGPT Library：

`/Mushoku-Tensei-Lore/source/working/无职转生_沙盒_MVU_working_v0.5-alpha.json`

SHA-256：`71747ec5d64ec1bf5e6cbab4f294cf27632521384dce82097f3bb35671c80b6e`

可重建 builder 已备份：

`/Mushoku-Tensei-Lore/source/working/build_mvu_v0_5.py`

SHA-256：`612a40f6b532ea6d4eb87cd160c0acd7a6a0292f3941bff96beb4882f0a6ca82`

静态 QA：`qa/QA_MVU_v0.5-alpha.md`。

## alpha 限制

本版已经完成结构构建和静态检查，但**尚未完成 SillyTavern / Android 实机回归**，因此禁止称为正式封版。

下一轮只验证：

1. 开场第一楼面板显示。
2. 每楼 `<causality>` 正确刷新且不串旧消息。
3. 双进度条数值/阶段/Δ正确。
4. 百死抽屉可展开、滚动、收藏高亮。
5. 死亡时复活按钮启用，存活时禁用。
6. 复活仅填输入框、不自动发送。
7. 复活后下一楼恢复存活，同时全部债务/纠正/关系/图鉴保持。
8. 320/360/390px 手机宽度点击与滚动无溢出。

## 禁止事项

- MVU 接管主线剧情导演。
- 再造第二套复杂数据库。
- 同时从时间线标签和 `<causality>` 重复累计数值。
- 把死亡本身当成因果偿还或世界纠正。
- 复活时清空任何既有债务或关系。
- 在核心实机 QA 通过前堆叠视觉素材、动画或音乐模块。

后续施工必须建立在 `runtime/000_当前唯一实时口径_v0.1.md`、working v0.4 数据层与本 `v0.5-mvu-alpha` 候选之上。
