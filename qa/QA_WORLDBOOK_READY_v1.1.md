# QA · Worldbook Ready v1.1

## 成品

唯一当前世界书成品：

`/Mushoku-Tensei-Lore/source/working/无职转生_沙盒_因果法典_worldbook-ready_v1.1.json`

ChatGPT Library file_id：

`file_0000000051e08230b278bcd712c3a9f6`

SHA256：

`83fd45276507e4bd2c9a46694ba546a8badb31c3e62ec2086a9c04d55f2cd2ee`

文件大小：`1,053,753 bytes`

最终 `character_book.entries = 254`。

`worldbook-ready v1.0` 自本版起仅保留历史用途，不再交给静静装配。

## v1.1 新增/修订

### 1. 补齐两条核心叙事设定

新增独立核心设定：

1. `<核心设定:因果显相·前世恶相回流>`
   - 因果越高，他人视觉与第一印象越接近鲁迪前世那个肥胖臃肿、油乱邋遢、萎靡且神情猥琐的成年男人旧貌；
   - 明确不是“灵魂形象”，不是新造外观，也不是肉体真正变回前世；
   - 0~100 按潜伏/裂纹/渗出/偏移/清算/极限逐级增强；
   - 只改变外观感知，不强制厌恶、不改写记忆、不改变现世物理身体。

2. `<核心设定:世界纠正·主角偏爱退潮>`
   - 世界纠正越高，六面世界越撤回鲁迪无代价的主角光环、巧合兜底、关系便利与命运偏爱；
   - 不是反鲁迪诅咒，不制造无因坏运气；
   - 鲁迪凭能力、真实付出或自由选择得到的好结果仍然成立；
   - CORR_ACTIVE=1 后生效，T+3前不倒灌。

### 2. 13名新增人物严格回归咩咩全栈 `chara-v1`

对帝皇娘 + 十二原体娘逐条检查并修正：

- 只保留标准字段：名字 / 性别 / 印象 / 发色 / 发型 / 瞳色 / 身材 / 胸部 / 上衣 / 下装 / 配饰 / 鞋子；
- 保留标准 `心理模型:`，仅含 `Trauma / Defense / Trigger / Need` 四槽；
- 对话范例统一为3句；
- 删除自造栏位 `性格特征:` 与 `行为与表达特征:`；原内容折回 `印象` 与心理模型，不另造第五类字段；
- 不在人物条目内新增能力/技能字段；
- 13/13 标签闭合 PASS。

### 3. 新增人物 entry metadata 对齐母卡人物条目

13/13：

- `constant=false`
- `selective=true`
- `position=after_char`
- `use_regex=true`
- `extensions.selectiveLogic=0`
- `extensions.position=1`
- `extensions.depth=4`
- `exclude_recursion=true`
- `prevent_recursion=true`

### 4. 新增核心规则条目回归全栈核心设定格式

以下4条全部采用 `<核心设定:名称> ... </核心设定:名称>`：

- 因果法典·帝皇T+3监察
- 因果法典·死亡签与百死图鉴复活
- 因果显相·前世恶相回流
- 世界纠正·主角偏爱退潮

metadata 对齐母卡核心设定的 after_char / depth4 / selectiveLogic0 注入结构；作为全局世界规则保持 `constant=true`。

### 5. realtime affinity 槽检查

`实时因果与世界纠正-咩咩affinity槽` 继续保留 `{{setvar::affinity_format::...}}` 特殊 runtime 结构，不强行包装成核心设定标签。

原因：该条职责是复用咩咩预设原生 `affinity_format` 输出槽，而不是普通世界观条目。

本版仅新增两条阶段叙事反馈引用：

- 因果阶段 -> `因果显相·前世恶相回流`
- 世界纠正阶段 -> `世界纠正·主角偏爱退潮`

## 继承完整性 QA

PASS：

- v1.0 中 id 0~235 的既有条目对象在 v1.1 中完全不变；
- 原236条母卡继承内容没有因本次格式修订被重写；
- 46条时间线及其已封板机器标签没有被本次修订触碰；
- 新增条目 id 为 252、253，无ID冲突；
- 最终254个entry ID唯一。

## 冻结结论

`worldbook-ready v1.1` 自本 QA 起取代 v1.0，成为唯一允许交给静静的世界书成品。

静静仍然只负责 MVU / ZOD / initvar / 脚本 / CDN / Candidate 打包 / Android-SillyTavern 实机返工。

**静静不得再修改 character_book 业务正文。**
