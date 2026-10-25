# 因果法典 · 独立 MVU 模块 v1.0.1

本轮直接基线为已交付的独立模块，施工起点为 `b90e5a54a4723b49e0cb9690b41636de81ac05b1`。仅修数值可视化与宣言背景：双数字/阶段区常驻，最新回复缺块时回看最近有效结算；首次尚未结算显示 `-- / 100`。宣言新增纯CSS黑曜石、圣金日轮、六面魔法纹和字幕承载面板。播放、字幕时间轴、死亡机制、世界书均未改动。

本包只包含 MVU 源码、接口、机械状态、冻结媒体配置、mock 测试页与接入说明。没有完整角色卡、character_book 业务正文、Candidate JSON 或 Candidate PNG，也不会读取或生成它们。

设计来源：仓库 `f0e29fa7e5341183c095e93c7658c53b23f7a6fe` 的 MVU v0.8 FINAL VISUAL、runtime v0.2、正式媒体 manifest，以及咩咩制卡·全栈 v1.0.0 的实际接口与脚本结构。v0.8 样式保留在 `src/panel.css`，正式接线在 `src/runtime.js`；静态预览中的 onclick、假数值与演示按钮没有进入正式运行脚本。

## 交付内容

| 路径 | 用途 |
| --- | --- |
| `dist/causal-codex.js` | 无本地依赖的正式角色脚本，直接粘贴到酒馆助手脚本库 |
| `dist/tavern-helper-scripts.json` | 咩咩空模板同形状的三个脚本对象数组；不是 CCv3 卡 |
| `src/MVU.js` | 官方 MagVarUpdate 单行 import |
| `src/schema.js` | 全栈原生 ZOD schema / registrar，使用环境提供的 z 与 _ |
| `dist/schema-extension.js` | 已有 schema 时使用的扩展定义，不含第二个 registrar |
| `src/initvar.yaml` | 根字段初始化，不带 stat_data 包裹 |
| `src/core.js` | causality 解析、阈值去重、唯一 pending、抽签、结算、复活 |
| `src/facts.js` | 只读查找聊天中最近一个完整有效 causality；忽略用户消息与未完成/无效块 |
| `src/runtime.js` | Mvu 读写、只读字段保护、单实例挂载、生命周期、输入框桥 |
| `src/view.js` | 锁屏、字幕、20格、翻签、图鉴、复活视图 |
| `src/panel.css` / `src/mobile.css` | v0.8 视觉与手机端、低动效补充 |
| `dist/panel.html` / `dist/panel.css` | 挂载壳与完整 CSS；运行脚本已内置同样资源 |
| `data/cdn-config.json` | 原 manifest 的 MP3 与 WebP CDN 映射 |
| `data/death-catalog.v0.1.json` | 用户指定的100个稳定编号和名称，原字节复制 |
| `data/death-catalog.metadata.v0.2.json` | 同编号的冻结八类 / scene_tags 元数据 |
| `src/catalog.js` | 校验和读取上述词表；提供可选远程读取入口 |
| `data/captions.v0.2.json` | 原31段字幕时间轴，原字节复制 |
| `demo/index.html` | 独立 mock 页面，使用同一正式运行模块 |
| `tests/` | 自动化测试与实际结果 |
| `QA_MVU.md` | 已验证项目与真实酒馆待验边界 |

## 挂载进现有 CCv3 卡

最终本地整卡装配由你进行。以下步骤不要求重写任何人物、地点、时间线、核心设定或其他业务正文。

1. 在酒馆助手的角色脚本库检查是否已经启用 MVU。已有同一核心时复用它；没有才新增 `src/MVU.js`。禁止同时启用两份核心。
2. 接入 ZOD：没有现有 ZOD 时使用 `src/schema.js`。已有 ZOD 时将 `dist/schema-extension.js` 的定义合入原脚本，再把 `...CodexShape` 加到现有根 schema；仅保留原来的一个 `registerMvuSchema`。不要拿独立 schema 替换原 schema。
3. 处理技术初始化：将 `src/initvar.yaml` 的 `_causal_codex` 根字段加入你本地装配的 `[initvar]` 技术初始化内容；条目必须保持禁用、constant=true、角色定义之后，由 MVU 读取。它是本包提供的技术片段，不含业务正文，本包不会自动修改任何世界书。若已有 initvar，只合入这一根字段，不包 `stat_data:`，不覆盖其他字段。
4. 新建一个启用的角色脚本“因果法典 · 独立MVU”，粘贴 `dist/causal-codex.js` 全文。该脚本已经内置小型 JSON 词表、CSS、字幕和 URL 配置，无需部署本地模块路径，也无需 Base64 媒体。`dist/tavern-helper-scripts.json` 提供相同的原生脚本对象，可供支持该形状的本地导入工具使用；各版本酒馆助手导入 UI 差异未实机确认，手动粘贴路径最明确。
5. 原有变量列表若已使用 `{{format_message_variable::stat_data}}`，它会包含 `_causal_codex`。保留这条既有读取链；将 `integration/机械只读规则.md` 的技术约束纳入你本地的变量更新规则。不要新建第二套 `<UpdateVariable>` 协议。
6. 卡内原来已有全栈的两条清理正则时复用；没有时可导入 `dist/regex.json`。它们只隐藏更新块及占位符，不删除 `<causality>` 原始消息数据。
7. 启用嵌入式角色脚本与卡内正则。先在独立 mock 页验收，再在真实酒馆进行下述实机检查。

脚本将唯一一份法典挂到最新 assistant 楼层 `.mes_text` 底部；新楼层出现时移动同一实例，历史楼层不会各复制一份法典。不创建悬浮窗。没有有效 `<causality>` 时显示等待信息，机械态保持原样。

## 公开事实与场景接口

从 `getChatMessages(id)[0].message` 读取原始 `<causality>`，每个完整块仍采用 runtime v0.2 的数值、阶段名、生死及 RT 格式。由新到旧查找 assistant 消息，并在同条消息中由后向前选最近的完整有效块；忽略用户消息、无效块和未完成的流式输出。两个数值和阶段名直接读取，前端不重算伦理，不从叙述推算日期或 T+3。

显示值不会因最新回复缺块而消失：向前读取最近有效值；当前消息流式编辑暂时失去完整块时，在本聊天内保留最近成功显示的原值；换聊天清空这份短暂显示缓存。缓存不写入另一套数值数据库，也不用于机械结算。缺块时不推进阈值、抽签或死亡状态。没有任何有效记录时两条数字显示 `-- / 100`、阶段显示待结算、提示“等待首次因果结算”，40格仍保留。

数字旁显式显示原块给出的阶段：因果为潜伏/裂纹/渗出/偏移/清算/极限，纠正为萌芽/局部纠偏/结构松动/秩序重构/深层校正/高位稳态。当前进度填色数量为 `floor(读取值 / 5)`；过去已跨阈值以金边记录，历史基线低亮。数值下降时当前填色随之下降，机械阈值记录不清除、不重抽。

死亡词条必须先匹配场景。冻结的标准 causality 没有必填 scene_tags，因此不能凭空把“日常”当作所有场景的默认值。主装配侧可通过下面任一公开方式提供**明确的当前场景事实**：

```js
// 方式一：逐消息提供。messageId 使用真实 assistant 消息ID。
await window.parent.CausalCodex.setSceneContext(messageId, {
  tags: ['旅行', '迷宫'],
  rudyPresent: true,
  emperorPresent: false
});

// 方式二：挂载一个同步或异步的场景提供器，供之后的消息读取。
window.parent.CausalCodex.setSceneProvider(({messageId, causality}) => {
  return {tags: currentSceneTags, rudyPresent: isRudyHere,
          emperorPresent: isEmpressActuallyIntervening};
});
```

或者，如果主装配侧**原本就提供**可选 RT 字段，可读取 `SCENE_TAGS=旅行,迷宫;RUDY_PRESENT=1;EMPEROR_PRESENT=0`。模块不要求为它修改业务正文；未知时留空即可。`任何` 只有主装配侧明确传入这个 tag 才生效；不会自动变成通用匹配。帝国审判还要求 emperorPresent=true。

没有明确场景、鲁迪不在场，或该场景全部候选已发现但尚未集齐100种时，保留一个未抽签的 pending trigger。后来提供可用场景时才抽签，仍最多一次。已抽中的 pending 包含锁定 ID、名称与分类，直接进入只读机械投影；不依赖整份世界书词表。UI 的“填入输入框”只触发 textarea input 事件，由用户决定是否发送。

## 状态存储与去重

- 唯一持久化机械状态在 **MVU chat 变量** `stat_data.$causal_codex`，通过 `Mvu.getMvuData / replaceMvuData({type:'chat'})` 读写，不建立另一套数据库。
- message 范围的 `stat_data._causal_codex` 是供模型读取的机械投影，不存放另一份因果/纠正真值。机械 cursor 只用于比较已跨阈值，不可反向修改 causality。
- `turns`、`marks`、`seen` 均以稳定 ID / 阈值作为 record 键。已处理消息ID包含编辑与 swipe：不按文本哈希另造新回合、不重抽。
- MVU `VARIABLE_UPDATE_ENDED(new_data, old_data)` 写入前恢复被模型改动的机械字段；之后从 chat 机械态重投影。其他宿主变量、schema 与 envelope 字段原样保留。
- 首次安装到已有聊天，以当时数值建立历史基线，避免追溯抽签。若先观察到 T+3 前状态，再观察到 `CORR_ACTIVE=1`，当前因果下方阈值全部归历史，纠正从0开始记录。
- pending 最多一个。pending 期间其他阈值照常登记并消耗，永不补抽。只有正文死亡行与锁定死法名称一致才将它转为 settled；不由“场景可发生”推定死亡。
- 复活仅增加次数与 `_revive_pending`，显示存活并向下一轮提供明确的机械继承提示；不改原始消息，不读档、不清除历史。主模型必须读取该只读提示，并在下一次有效 causality 中继承存活；若未确认继承，模块会保留提示并暂停新抽签，不擅自宣告第二次死亡。
- 删除消息、切聊天与关闭脚本会清理视图、事件和音频；chat 机械态随酒馆聊天保存。切聊天的未完成异步任务有 epoch 检查，不会把旧结果写入新聊天。
- 不允许两个标签页同时操作同一聊天机械态；MVU 的 replace 接口没有跨标签页 CAS。本包串行化本实例的更新与点击。导出聊天时应保留 MVU chat 变量，否则无法恢复过去的机械去重记录。

## 宣言与视觉

首设备首载用持久化偏好 `mushoku_causal_codex_opening_seen_v1`；新聊天和刷新不重播。首次有声自动播放失败时显示“播放宣言”；跳过或播放完成才写 seen。网络失败保留进入法典入口，不写 seen，也不阻断主逻辑。玩家可点“以后只显示箴言”，仍可手动回听。

字幕按 MP3 currentTime 匹配31段 cue；140.042 秒进入无新字幕尾奏，151.5 秒浮现箴言，158 秒收束。媒体本体实测 MP3 容器时长158.093秒，视觉按已冻结的158秒收束，音轨本体不做裁切或修改。

普通顺序：箴言 → 双20格 → 本回合/最近死亡签 → 图鉴 → 复活。QUIET 金印40%、OBSERVE 短亮350ms、INTERVENE 仅宣言/回听/复活。未发现名称在 DOM 中只呈现“未记录”；类别内分页与内部滚动，不把100条一次铺开。Shadow DOM 隔离宿主 CSS。主立绘仅在手动视觉锚点中出现；图库 ALT 不替换正式主立绘。v1.0.1的开屏装饰均为非交互CSS层，位于字幕与按钮之后；不引入视频、外部图片或持续闪烁。

## 本地复现

```sh
cd modules/causal-codex
node --test tests/*.test.mjs
python3 tools/build.py
python3 -m http.server 8765
# 浏览器打开 http://127.0.0.1:8765/demo/
```

构建脚本只读取固定白名单内的 MVU JSON、CSS、JS 和媒体 manifest。不会搜索 source/original、source/working 或完整角色卡。测试页的 sessionStorage 只模拟 MVU 持久化，不用于正式模块。

有 Playwright 时，停止上述手动HTTP服务后运行：

```sh
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright node tests/browser.cjs
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright node tests/rework-browser.cjs
```

两个浏览器脚本须顺序运行，各自自动启动并关闭本地HTTP服务。新增的四尺寸开屏/数值静态图在 `tests/rework-static/`，24项返工检查结果在 `tests/rework-results.json`。浏览器测试中的 Audio 是可控 mock；真实 Android 音频策略、酒馆助手初始化和模型继承循环仍需实机验证，详见 QA。
