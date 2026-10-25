# 因果法典 · 本地最终合并桥 v0.2

用途：把当前唯一世界书 `worldbook-ready v1.3` 与 `modules/causal-codex` 独立 MVU 模块在用户本地合并。

本桥不重写任何既有业务世界书正文。它只：

1. 在 `data.extensions.tavern_helper.scripts` 中追加/更新因果法典 3 个稳定脚本 ID；
2. 在 `data.extensions.regex_scripts` 中追加/更新 2 个稳定正则 ID；
3. 追加 4 条全栈技术条目：变量更新规则、变量输出格式、变量列表、禁用 initvar；
4. 对原有非本桥技术条目做对象级不变验证；
5. 支持重复运行，第二次不会重复注入。

## 当前正式输入

世界书：

`source/working/无职转生_沙盒_因果法典_worldbook-ready_v1.3.json`

Library file_id：

`file_00000000062081f598f6b1db392538fc`

SHA256：

`97c70ece2309dc398ae6342c3911b305fed0e10dac3b5e218a138ac4cf4ed7be`

MVU模块：

`modules/causal-codex/`

静静初始独立模块提交：

`0a8ab5aca4d3bb31b96f9f1984291bf652b249e3`

> MVU 后续实机返工可以继续更新模块；世界书输入仍只认 v1.3，除非另有新的世界书封板版本。

## Windows / PowerShell 一条命令

在仓库根目录执行：

```powershell
python assembly/install_causal_codex.py "source/working/无职转生_沙盒_因果法典_worldbook-ready_v1.3.json" "build/无职转生_沙盒_因果法典_MVU-merged.json"
```

然后验证：

```powershell
python assembly/verify_causal_codex_install.py "build/无职转生_沙盒_因果法典_MVU-merged.json"
```

当前 v1.3 输入仍为258条业务世界书，因此正确结果应至少包含：

- `PASS: true`
- `entries: 262`
- `scripts >= 3`
- `regexes >= 2`
- `technical_entries: 4`

## 新增的四条技术条目

- `[mvu_update]因果法典变量更新规则`
- `[mvu_update]因果法典变量输出格式`
- `变量列表｜因果法典`
- `[initvar]因果法典MVU变量初始化勿开`

其中 initvar：

- `enabled=false`
- `position=after_char`
- 内容从 `_causal_codex:` 根字段开始
- 不允许包 `stat_data:`

这些都是咩咩全栈的技术装配层，不是新增业务世界书设定。

## v1.3 世界书边界

v1.3 已经完成：

- 新增业务条目排序返工；
- 46条时间线全量标签审计；
- `KARMA_BASE` 同步重算；
- 帝皇关键词补全为 `人类帝皇|帝皇娘|帝皇`。

本桥不得重新调整上述世界书内容。MVU 的数值显示和宣言视觉返工属于 `modules/causal-codex`，与 worldbook v1.3 分离。

## 安全边界

脚本只会替换自己拥有的稳定 ID / comment。任何其他人物、地点、设定、时间线、宿主脚本和宿主正则都保留。

如果未来输入卡已经有其他 MVU/ZOD 系统，应先人工审计冲突；当前 worldbook-ready v1.3 的 `tavern_helper.scripts` 与 `regex_scripts` 仍为空，因此正式输入不存在该冲突。
