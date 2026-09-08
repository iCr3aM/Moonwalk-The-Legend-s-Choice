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

- [x] **结局海报两页职责重组（2026-09-09 用户拍板）**：**第一页=人生回响（数据页）**——属性条/主导路线·关键词·传奇评分/净资产·格莱美/成就 emoji/关键抉择两列矩阵/人生足迹行；**第二页=传奇文案（纯文案页）**——主视觉（星徽+结局名+tone）+结局简介+独白+扩写尾段+尾声+语录签名；语录取消吸底改跟随内容。翻页提示同步更新（「下一页翻看传奇独白与尾声」）；`i18n.js` 恢复 `ui.posterFootprint` 键。
  - 撤回记录：此前两版排版方案（动态居中/自适应字号/收束行/行距放宽）已回退——纯排版不解决观感；关键抉择**时间线遍历**保留（history 全量 key，1958-2026 分段采样、段内取 keyWeight 最高，两列矩阵 12 条）。
- [x] **创作企划器扩展 · 批次1+2（2026-09-09 落地，提交 36ce16a）**：
  - 批次1 预算方差：6 企划点（含 6_3b）18 选项带预算档位（激进/稳健/保守，hint 标注），resolveGrammy 读 cp_budget 对 q ±8；新成就 ACH_HIGH_STAKES「豪赌成真」（成就 88→89）
  - 批次2 决策风格接权：STYLE_VARIANT_WEIGHTS 五组映射，pickVariant 命中后的选择偏好按 decisionStyle 加权（先锋→时代/生平 ×1.3；隐居→闪回/惊悚 ×1.3、合作 ×0.8；商业→合作/邀约 ×1.25；温润→家庭/子女 ×1.3；匠人→趣事 ×1.2）；独立掷骰保持原触发率（加权放触发骰曾致 V_REL_FRANK 归零，已修正）
  - 现状：6 个企划点（2_3/3_1/4_2/5_1/6_1/6_3b）写 cp_* 五维画像 → resolveGrammy 六 era 涌现（含预算 ±8）→ 专项造诣 + decisionStyle（已接变体权重）
  - 批次3 ✅（2026-09-09 落地）：END_ETERNAL 主带 art 门槛加制作造诣豁免（art≥60 或 cp_craft≥70 且 art≥55，需加冕标志不变）；硬约束矩阵 +4 断言；5000 局审计分布健康
  - 每批次独立 npm test 全绿后提交
- [x] **成就叙事化 M11 · 方案定稿（2026-09-09，待开工）**：落点=结尾海报第二页（传奇文案页）尾声之后、语录之前；完整方案见下：
  - 选取：本局点亮成就中「有叙事模板」者，按稀有度（legendary>epic>rare>uncommon）+ achievementReach 稀有度升序取前 4；无模板的成就不进叙事段（保通顺）
  - 文案：新增 config.achievementNarr 表（id → 第一人称回望短句 15-25 字），首批覆盖 epic/legendary + 高光 uncommon ≈ 25-30 条，EN 全量
  - 拼接结构（通顺保障）：固定引导句「回望这一程，有几枚瞬间格外滚烫——」+ 模板句以「；」并列 + 固定收束句「它们不是奖赏，是路标。」（列表式并列，句法各自独立，不依赖上下文）
  - 固定性：选取无随机（稀有度+固定序）→ 同一海报叙事恒定（与语录固定种子原则一致）
  - 绘制：文案页尾声后：小标题「高光时刻」+ 分隔细线 + wrapParagraph 15px（预算高度，空间不足截至 2 条）
  - 门禁：check_i18n_coverage 第四阶段加 achNarr 前缀；复跑 _audit_poster_quotes；纯展示层零判定影响
  - 工作量：模板 30 条 zh+en + 文案页绘制 ~25 行 + 门禁扩展 ~10 行
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
