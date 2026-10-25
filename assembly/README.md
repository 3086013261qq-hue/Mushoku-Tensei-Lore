# 因果法典 · 本地最终合并桥 v0.1

用途：把已经封板的 `worldbook-ready v1.2` 与 `modules/causal-codex` 独立 MVU 模块在用户本地合并。

本桥不重写任何既有业务世界书正文。它只：

1. 在 `data.extensions.tavern_helper.scripts` 中追加/更新因果法典 3 个稳定脚本 ID；
2. 在 `data.extensions.regex_scripts` 中追加/更新 2 个稳定正则 ID；
3. 追加 4 条全栈技术条目：变量更新规则、变量输出格式、变量列表、禁用 initvar；
4. 对原有非本桥技术条目做对象级不变验证；
5. 支持重复运行，第二次不会重复注入。

## 当前已知正式输入

世界书：

`source/working/无职转生_沙盒_因果法典_worldbook-ready_v1.2.json`

SHA256：

`74a3829a45f9271d749c16a3421a1b2f39e75b7907526de792bc6ffa98b6a910`

MVU模块：

`modules/causal-codex/`

静静交付提交：

`0a8ab5aca4d3bb31b96f9f1984291bf652b249e3`

## Windows / PowerShell 一条命令

在仓库根目录执行：

```powershell
python assembly/install_causal_codex.py "source/working/无职转生_沙盒_因果法典_worldbook-ready_v1.2.json" "build/无职转生_沙盒_因果法典_MVU-merged.json"
```

然后验证：

```powershell
python assembly/verify_causal_codex_install.py "build/无职转生_沙盒_因果法典_MVU-merged.json"
```

正确结果应至少包含：

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

## 安全边界

脚本只会替换自己拥有的稳定 ID / comment。任何其他人物、地点、设定、时间线、宿主脚本和宿主正则都保留。

如果未来输入卡已经有其他 MVU/ZOD 系统，应先人工审计冲突；当前 `worldbook-ready v1.2` 的 `tavern_helper.scripts` 与 `regex_scripts` 均为空，因此本次正式输入不存在该冲突。
