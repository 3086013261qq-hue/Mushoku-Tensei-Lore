# MVU 后续楼层实时刷新修复 QA

日期：2026-10-25（Asia/Shanghai）
直接基线：33c49205761760d1215b7417ac6f90e5a0b13ee1
范围：modules/causal-codex 独立模块与 release ZIP。

## 实施

- facts/runtime 共用 assistant 判定：`row && row.is_user !== true && (!row.role || row.role === 'assistant')`。
- 共用正文读取：`row.message ?? row.mes ?? ''`；消息列表与末楼 ID 通过 await Promise.resolve 正规化。
- 最近有效块查找从最新 AI 楼向前，跳过未闭合、无块、解析失败的消息；保持既有 parseCausality 不变。
- 消息/变量事件立即 refresh，并在 120ms 后二刷；GENERATION_ENDED 仅在宿主实际提供常量时监听。
- 每 1000ms 在可见页面且 #chat 存在时刷新。没有最新 AI .mes_text 时不创建面板。
- dispose 清除 interval、所有待执行二刷、事件监听；聊天切换废弃旧队列与二刷。
- 最新 AI 楼挂载同一个 host；DOM 重绘后重新挂回原 host，清除旧的重复 host。
- 机械层代码未修改；仍调用原有按 message id 去重的处理，不重算伦理或因果/纠正分值。

## 自动化结果

`npm test`：22/22 PASS。
`CHROMIUM_EXECUTABLE=/tmp/chromium node tests/refresh-browser.cjs`：60/60 PASS。
浏览器：Chromium 153.0.8010.0，Playwright；实际 DOM 与 Shadow DOM，控制浏览器时钟验证 120ms、1000ms 与十次轮询。
四组独立运行：src × 同步接口、src × Promise 接口、dist × 同步接口、dist × Promise 接口。
完整逐项输出：tests/refresh-results.json。

| 必验项 | 结果 | 证据 |
| --- | --- | --- |
| message/mes 双字段 | PASS | role+message、缺 role+is_user:false+mes、role+is_user:false+mes 均更新可见数值 |
| 缺 role 兼容 | PASS | 缺 role AI 消息可迁移 host；is_user:true 即使 role=assistant 仍排除 |
| 事件立即刷新 | PASS | 现有全部消息/变量事件及实际提供的生成结束事件均立即读取 |
| 120ms 延迟二刷 | PASS | MESSAGE_UPDATED 先发生，正文在第 120ms 写入；119ms 保持旧值，第 120ms 显示新值 |
| 1秒 polling fallback | PASS | 不触发 Tavern 事件，只增添返回消息；1000ms 后可见值更新 |
| 流式块完成后自动更新 | PASS | 20 → 最新楼未闭合时保持20 → 同 id 补完整后自动25 |
| 同 message id 重复轮询不重复抽签 | PASS | 实际抽出签后轮询10次，随机调用次数、阈值、death_seen、revive 与整个机械态和写入计数完全不变 |
| 复活后轮询 | PASS | 真实按钮调用原有复活流程后再轮询10次，reviveCount=1，整个机械态、随机调用次数、写入计数不变 |
| 单实例 host 迁移 | PASS | 320/360/390/440px，连续新 AI 楼、mes_text 重绘、注入重复空 host 后，始终恢复原始 host 到最新 AI 楼；全聊天仅一个主面板，无横向溢出 |
| 生命周期 | PASS | 隐藏页面/移除聊天后轮询不读取；dispose 后延迟任务/轮询停止且 host 移除 |

## 范围完整性

src/core.js、src/view.js、src/panel.css、src/mobile.css、src/assets.js、所有 data/ 冻结文件逐字节等于直接基线。
未修改 worldbook、character_book、时间线、KARMA_BASE、关键词、OLD01、死亡词表、死亡签算法、复活规则、宣言、音频、图片或主题。
dist/panel.css、panel.html、regex.json、schema-extension.js 与直接基线完全一致；仅重建 dist 运行时及脚本导入包。
没有生成整卡 JSON/PNG。

本结果为浏览器兼容接口回归；没有声称已完成真实 Android / SillyTavern 实机验收。

## 导入

使用 ZIP 内 dist/tavern-helper-scripts.json 替换现有同 ID 独立脚本，避免额外复制一份运行时；本文件是 Tavern Helper 脚本包，不是整卡 JSON。
ZIP 包含独立模块源码、dist、冻结 data、构建脚本、新增回归测试与本 QA；已有 QA/历史结果保留历史含义。
重建：python3 tools/build.py；单测：npm test；浏览器回归：node tests/refresh-browser.cjs（需 Playwright 和可用 Chromium，可用 CHROMIUM_EXECUTABLE 指定路径）。
