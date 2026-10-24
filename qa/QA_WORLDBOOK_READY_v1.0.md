# QA · Worldbook Ready v1.0

## 成品

唯一世界书成品：

`/Mushoku-Tensei-Lore/source/working/无职转生_沙盒_因果法典_worldbook-ready_v1.0.json`

ChatGPT Library file_id：

`file_00000000d13c82308cf50165b9ccac80`

SHA256：

`609b10db04c7e759e65e13ab3efd800bb0259cd17a28eb1581258268e35690f7`

文件大小：`1,046,333 bytes`

## 世界书条目数

- 授权母卡原条目：236
- working v0.4 实时因果/纠正条目：1（id 236，已升级最终生死事实行）
- T+3 帝皇 Overlay：1
- 死亡签/百死图鉴/复活规则：1
- 帝皇娘：1
- 十二原体娘：12
- 最终 character_book entries：252

## 原文继承 QA

PASS：

- 原236条全部保留；
- 原97人物正文：0业务改写；
- 原30地点正文：0业务改写；
- 原41核心设定正文：0业务改写；
- 原 status / combat / output / memory 等非时间线成熟条目：0业务改写；
- 原46条时间线全部保留；
- 将 `RUNTIME_BASELINE`、`[因果:*]`、`[纠正:*]`、`[旧世因果源:*]`、`[旧世因果回流:*]`、`[去重:*]` 等本项目机器标记剥离后，46/46 时间线正文与授权母卡对应原文逐条一致；
- 46/46 时间线含 `RUNTIME_BASELINE`。

## 新增人物 QA

PASS：13/13。

- 人类帝皇（帝皇娘）1条；
- 十二原体娘12条；
- 全部沿用母卡普通人物 entry 结构：`constant=false`、`selective=true`、`position=after_char`、`use_regex=true`；
- 全部使用 `<story_scene>` 触发正则；
- 全部 character 标签闭合；
- 不替换任何原97人物。

## 新增设定/规则 QA

PASS：

- realtime affinity/causality 条目保留并升级：输出因果、纠正、鲁迪生死；
- T+3 帝皇 Overlay 独立新增；
- 死亡签/百死图鉴/复活规则独立新增；
- 原41核心设定没有被拿来承载新规则、没有改写。

## 冻结结论

`worldbook-ready v1.0` 自本 QA 起封板。

后续静静只负责 MVU / ZOD / initvar / 脚本 / CDN / Candidate 打包 / Android-SillyTavern 实机返工。

**静静不得再修改 character_book 业务正文。**
