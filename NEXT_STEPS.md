# 下一步待办 / Next Steps（当前权威快照）

> 维护说明：本文件是项目**唯一**的「当前状态 + 待办」汇总入口，替代散落在 GDD.md / README / 记忆中的过期条目。
> 任何事实性计数（结局 / 变体 / 成就 / 彩蛋）一律以源码为准：`js/config.js`（结局、成就、属性）、`js/events.js`（变体、彩蛋、趣事）。文档若与源码冲突，以源码为准，并回头更新对应文档。
> 历史版本快照：`archive/NEXT_STEPS_2026-09-08.md`、`archive/NEXT_STEPS_2026-09-09.md`。
> 最近更新：2026-09-09（审计环节收官）。

---

## 一、当前权威状态（v1.14）

- **游戏形态**：H5 文字人生模拟，原生 JS 模块化、**无框架、无构建**，双击 `index.html` 即运行；`build_singlefile.cjs` 可产出单文件 `dist/index.html`。
- **结局**：**30 种 = 23 主线 + 7 假设线（架空历史 `END_ALT_*`）**，含 1 隐藏终极 `END_TRUE_ETERNAL`。
- **六维属性 + Economy 双轨**：健康/声誉/财富/家庭/艺术/压力（0–100）；`netWorth`/`debt`（万元）。
- **四条元路线**：艺术家/慈善家/商业巨擘/隐士。
- **变体（可能性系统）**：**141 个**（`check_dup_events` 实测），按「概率 + 年份窗口 + cond」注入。
- **关系网**：10 个 rel key + 6 位具名合作者羁绊卡（`collaborators.js`），结识门控 `state.relMet` + `metCond`，未结识渲染锁定态。
- **成就 / 彩蛋 / 趣事**：成就 **88**、彩蛋 **43**（含 3 密蛋）、趣事 **61**（全部审计可达）。
- **测试门禁**：`npm test` **28 个** `test/*.cjs` 全绿（并行矩阵，EXIT=0 为真绿）。
- **健康度（2026-09-09 实测）**：`npm test` EXIT=0；人物一致性 3600 局 0 违规；flag 闭合 0 死门控；结局文案一致性 0 违规；硬约束矩阵 45/45。

---

## 二、✅ 已收官：逻辑一致性审计环节（2026-09-09）

> 以「未结识不出现 / 选了什么线就见什么内容 / 写入必有来源」为准绳的系统性遍历审计，已全部转为常驻门禁并接入 `npm test`。

- [x] **A. 关系网结识门控**（`_audit_rel_met`）：`state.relMet` + `MJ.isCollaboratorMet`；羁绊卡锁定态；修复昆西在组合线/独立制作线（solo_prod）的泄漏（2_1b 文本分支、V_BIO_WIZ/V_REL_QUINCY cond、2_4 opt0 effects、2_6 文本+选项分支、V_COLLAB_OTW 排除）；三路线定向 + 2000 随机局断言。
- [x] **B. 具名人物一致性全遍历**（`_audit_person_consistency`）：逐事件扫描文案，七位具名人物未结识被提及即违规；3600 局 0 违规；揪出并修复 `2_7 戴安娜未结识泄漏`。初遇白名单：1_3/2_1/2_1b/V_OFFWALL_QJ/V_BIO_WIZ/4_3b/5_5/6_2。
- [x] **C. flag/timeline 写-读闭合**（`_audit_flag_closure`）：读侧扫描全部真实加载的 cond/text/options/onEnter/effects 函数源码（含 engine/config 别名 `f.`/`tl[`）；写侧 = 1500 局运行时 Proxy 记录 + events/engine/planner 源静态扫描 + planner 动态键白名单。揪出并修复 2 个死门控：`flags.thisItScale`（TRIVIA_THISISIT 遗留键 → thisItFull/thisItReduced）、`flags.legalTrouble`（ACH_PACIFIST 遗留键 → 移除）。反向「写而未读」仅 WARN。
- [x] **D. 结局/尾声/独白扩写文案一致性**（`_audit_ending_texts`）：每局结局的 summary/monologue/扩写尾段/尾声模板按该局结识状态断言；3000 局 0 违规；白名单 END_ALT_NO_QJ×quincy（「没有昆西的人生」文案主旨）。
- [x] **E. 硬约束矩阵**（`_audit_hard_constraints`）：构造边界态直调 resolveEnding，45 项断言全部通过——负债/烧伤压倒成功型与 ALT、TRUE_ETERNAL 九项边界、ALT 六级优先链、法律 END_CONTROVERSIAL 压倒 ALT、续章带永不悲剧、路线型/原型结局与 QUIET_LIFE 兜底。

---

## 三、玩法 / 内容扩展待办（下一阶段）

- [x] **结局海报两页密度优化（2026-09-09 第二版，待用户看效果再迭代）**：
  - 正面：正文**自适应排版**——内容少时字号/行距升档（15/28 → 16/32 → 17/36），块高垂直居中（系数 0.5）；正文后接「关键词·传奇评分」收束行 + 「人生足迹」行（结识 X/6 · 关键抉择 · 命运分岔，`drawFootprint` 双面共用）。
  - 背面：**关键抉择改为时间线遍历**——玩家 history 中全部 key 抉择按年份升序，1958-2026 分段均匀采样（每段取 keyWeight 最高者）最多 9 条，单列时间线呈现（年·标题 / 选择两行式）；属性行距 44→52、emoji 行距 42→50；尾声后足迹行。
  - 约束遵守：未触碰语录区与人物文案门控；npm test 28 门禁全绿。
- [ ] **创作企划器扩展**（深度游玩 C 的剩余半项）。
- [ ] **多周目传承 M10 / 成就叙事化 M11 / 关键抉择回放 M12**（g6 可视化增强）。
- [ ] **重复游玩**：每日挑战、硬核纯净、NG+、结局达成向导、最接近结局提示。
- [ ] **系统化彩蛋、更多结局候选**；性能/无障碍（移动端、轻量可视化、社交增强）。

> 优先级建议：新内容（变体/结局/文案）落地时自动受 28 门禁约束，无需先补审计；扩展类（M10-12/重复游玩）按体验优先级拍板。

---

## 四、工程 / 验证

- [x] **`npm test` 28 门禁并行矩阵全绿**（2026-09-09 实测 EXIT=0）。
- [x] **状态栏 UI 去重与人物志改造（2026-09-09）**：财富条去掉「($X 万)」附注（净资产以右上角 header 为唯一权威显示，含负债红字）；「关系总览」大按钮移除，入口改到羁绊面板标题行「👤 人物志」，弹窗副标题加「已结识 X / 6」收集进度——定位为人物图鉴（身份/年代/史料出处 + 未结识 ??? 预告），与 chip 行的好感数值互补。
- [ ] 发布前跑 `node test/_audit_playthrough.cjs 5000` 与 `npm run e2e`（真机 Playwright：随机 6/6、结局 30/30、彩蛋 43/43）。
- [ ] 新增门禁一律遵守「信息型门禁=虚假通过」铁律：必须 `process.exit(1)` 才算 FAIL，结论须来自真实引擎调用（`choose/proceed/resolveEnding/checkFlags` 等），存在性断言不冒充可达性。
- [ ] 维护提醒：改 spine 事件年份须复跑 `check_balance_reach`；新增人物文案须过 `_audit_person_consistency`（未结识提及直接 FAIL，初遇事件加 INTRO_WHITELIST）。

---

## 五、归档指针

- 历史版本快照：`archive/NEXT_STEPS_2026-09-08.md`（里程碑明细/脚本归档/历史成果）、`archive/NEXT_STEPS_2026-09-09.md`（审计环节启动版）。
- 早期一次性脚本与原型：`archive/legacy-scripts/`、`archive/迈克尔·杰克逊：人生选择_原型归档.html`。
- 剧情文案深化 spec（已完成，本地不入库）：`docs/superpowers/specs/2026-09-08-narrative-deepening-design.md`。
