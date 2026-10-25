# 因果法典 · 本地最终合并桥 v0.3

用途：把当前唯一世界书 `worldbook-ready v1.4-order-final` 与 `modules/causal-codex` 独立 MVU 模块在用户本地合并。

本桥不重写任何既有业务世界书正文。它只：

1. 在 `data.extensions.tavern_helper.scripts` 中追加/更新因果法典 3 个稳定脚本 ID；
2. 在 `data.extensions.regex_scripts` 中追加/更新 2 个稳定正则 ID；
3. 追加 4 条全栈技术条目：变量更新规则、变量输出格式、变量列表、禁用 initvar；
4. 对原有非本桥技术条目做对象级不变验证；
5. 支持重复运行，第二次不会重复注入。

## 当前正式输入

世界书：

`source/working/无职转生_沙盒_因果法典_worldbook-ready_v1.4-order-final.json`

Library file_id：

`file_00000000a68082079d937e27b700eb9c`

SHA256：

`3c3511c133777dd171e37d66abb6e104d98e5a3db1df2a500d1bd46763b2a3de`

MVU模块：

`modules/causal-codex/`

静静初始独立模块提交：

`0a8ab5aca4d3bb31b96f9f1984291bf652b249e3`

> MVU 后续实机返工可以继续更新模块；世界书输入只认 v1.4-order-final，除非另有新的世界书封板版本。

## Windows / PowerShell

```powershell
python assembly/install_causal_codex.py "source/working/无职转生_沙盒_因果法典_worldbook-ready_v1.4-order-final.json" "build/无职转生_沙盒_因果法典_MVU-merged.json"
```

然后：

```powershell
python assembly/verify_causal_codex_install.py "build/无职转生_沙盒_因果法典_MVU-merged.json"
```

当前输入仍为258条业务世界书；技术层合入后应为262条。

## v1.4 世界书顺序边界

v1.4 已按咩咩全栈功能区归位：

- 实时因果/纠正 affinity 输出槽 → 输出规则区；
- 8条因果法典全局规则 → 核心规则区；
- 帝皇娘 + 十二原体娘 → 女性角色区；
- 原236条业务正文与相对顺序保持不变；
- v1.3 的时间线标签审计、KARMA_BASE 与帝皇关键词修复全部继承。

技术条目属于最终装配层，不属于业务 worldbook-ready；不得反向改世界书正文。
