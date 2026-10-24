# MVU v0.5-alpha QA

- 卡版本：`5.3.0-karma-correction-working-v0.5-mvu-alpha`
- character_book 条目：238
- 时间线条目：46 / 46
- `RUNTIME_BASELINE`：46 / 46
- 因果机器标签存在：PASS
- 世界纠正标签存在：PASS
- 实时因果/纠正 worldbook：PASS
- `<causality>` 新增生死行：PASS
- 开场 Placeholder：PASS
- TavernHelper scripts：['mvu-core', 'mvu-zod-schema']
- Regex scripts：['mvu-causality-panel', 'mvu-causality-waiting', 'mvu-hide-orphan-causality']
- 百死图鉴：100 / 100，唯一名 100 / 100
- `tavern_helper.variables` 类型：dict
- 因果/纠正不写入 MVU stat_data：PASS（Schema 仅 `mushoku_ui.death_seen/revive_count/revive_pending/last_death`）
- 复活按钮：只写机械派生态 + `#send_textarea`，不自动发送；不改因果/纠正/KSET/CSET/OLD01。
- inline JS：`node --check` PASS

## SHA-256
- working card: `71747ec5d64ec1bf5e6cbab4f294cf27632521384dce82097f3bb35671c80b6e`
- death catalog: `125891c6f4d665ad828084f16de68327396b39e229dd6fa1348de0ab2cb1c1cf`
- builder: `612a40f6b532ea6d4eb87cd160c0acd7a6a0292f3941bff96beb4882f0a6ca82`

## 尚未完成的实机项
- SillyTavern 开场第一楼实际挂载。
- 每楼 `<causality>` 刷新与旧楼消息隔离。
- 320/360/390px 手机宽度真实滚动与点击。
- 百死抽屉展开、滚动、已发现高亮。
- 死亡状态下复活按钮启用。
- `#send_textarea` 只填字、不自动发送。
- 复活后下一楼恢复 `存活` 且所有因果/纠正/账目状态保持。

因此本版仅可称为 `alpha candidate`，不得宣称实机封版。
