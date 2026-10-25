# QA · 因果法典本地合并桥 v0.1

## 测试输入

`worldbook-ready v1.2`

SHA256：`74a3829a45f9271d749c16a3421a1b2f39e75b7907526de792bc6ffa98b6a910`

原始业务/规则 entries：258。

## 合并桥测试结果

PASS：

- 原258条非本桥 entry 对象级完全不变；
- 仅新增4条技术 entry；
- 合并后总 entries = 262；
- 3个脚本稳定ID存在：
  - `causal-codex-mvu-core`
  - `causal-codex-zod`
  - `causal-codex-runtime`
- 2个正则稳定ID存在：
  - `causal-codex-hide-update`
  - `causal-codex-hide-placeholder`
- initvar 禁用、`after_char`、首层 `_causal_codex:`；
- 变量列表使用 `<status_current_variable>{{format_message_variable::stat_data}}</status_current_variable>`；
- 因果法典机械字段明确只读；
- 第二次重复运行后对象结果与第一次完全一致，证明注入幂等；
- 未写入 Candidate PNG；未修改封面；未修改任何原有人物/地点/时间线/核心设定正文。

## 当前尚未宣称通过

以下仍需用户真实 Android / SillyTavern 实机：

- Tavern Helper 对嵌入脚本数组的实际加载；
- MagVarUpdate/ZOD在真实酒馆中的初始化顺序；
- `<causality>` 与 `_causal_codex` 的跨回合继承；
- 首次宣言自动播放与 Android autoplay 策略；
- pending death → 正文死亡 → 一键复活闭环；
- Shadow DOM 与宿主主题/CSS的共存；
- 长聊天切换、swipe、编辑、删除消息后的去重稳定性。

## 结论

本桥可作为 `worldbook-ready v1.2 + causal-codex MVU v1.0.0` 的本地最终合并工具。下一步应先生成 merged JSON，再导入真实 Android / SillyTavern 测试；实机通过后才进行最终封面 PNG 打包。
