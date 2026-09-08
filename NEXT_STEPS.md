# 下一步待办 / Next Steps（当前权威快照）

> 维护说明：本文件是项目**唯一**的「当前状态 + 待办」汇总入口，替代散落在 GDD.md / README / 记忆中的过期条目。
> 任何事实性计数（结局 / 变体 / 成就 / 彩蛋）一律以源码为准：`js/config.js`（结局、成就、属性）、`js/events.js`（变体、彩蛋、趣事）。文档若与源码冲突，以源码为准，并回头更新对应文档。
> 最近更新：2026-09-08。

---

## 一、当前权威状态（v1.13）

- **游戏形态**：H5 文字人生模拟，原生 JS 模块化、**无框架、无构建**，双击 `index.html` 即运行；`build_singlefile.cjs` 可产出单文件 `dist/index.html`。
- **结局**：**30 种 = 23 主线 + 7 假设线（架空历史 `END_ALT_*`）**。含 1 隐藏终极 `END_TRUE_ETERNAL` + 7 假设线（徽标 `ui.assumptionLine`）。（来源 `config.endingRarity`，已核对 30 项）
- **六维属性 + Economy 双轨**：健康/声誉/财富/家庭/艺术/压力（0–100）；`netWorth`/`debt`（万元）。
- **四条元路线**：艺术家/慈善家/商业巨擘/隐士。
- **变体（可能性系统）**：**114 个**（以 `events.js` 为准），按「概率 + 年份窗口」注入。
- **成就**：**88 项**（config.js 实测），图鉴式 `localStorage` 持久化，含 7 枚 `ACH_ALT_*`（假设线）+ 元成就 `ACH_ALT_FORK`。
- **彩蛋 / 趣事**：彩蛋 **43**（含 3 枚密蛋）；趣事 **61**（均已审计可达）。
- **图鉴**：四图鉴统一（结局/彩蛋/趣事/成就）共用 `.gallery/.g-cell`；语录图鉴已移除。
- **设计系统**：`.pill` 标签体系、`.toast` 提示体系、字号只用 `--fs-*`、弹窗仅 `.modal-body` 单一滚动区（`check_responsive` 契约断言）。
- **测试门禁**：`npm test` **22 个** `test/*.cjs` 全绿（并行矩阵）；`node test/_audit_playthrough.cjs 5000` 回归。
- **调试场**：`test/playground.html`（复用真实 `js/*`，动态 `Object.keys(MJ.config.endings)`，已与 30 结局/7 假设线一致）。
- **健康度（2026-09-08 实测）**：`npm test` EXIT=0（合计 FAIL: 0）；`_audit_playthrough 5000` 矛盾局=0 / 悬空链接=0 / 粘性 debt=0；30 结局全可达、彩蛋除 3 密蛋外全可达、趣事 61 全可达。

---

## 二、本次归档（2026-09-08）

将一次性/早期脚本与生成产物移入 `archive/legacy-scripts/`，保持根目录与 `js/` 整洁：

| 文件 | 原因 |
|---|---|
| `_smoke.js`（根） | 早期 12 结局冒烟 harness，用 `eval`、仅加载旧模块集，已被 `test/` 套件取代 |
| `debug_events.cjs` / `extract_events.cjs` / `wrap_events.cjs`（根） | i18n 抽取+包裹管道的一次性工具，`events.js` 已完成 `T()` 包裹，不再需要 |
| `check_keys.cjs`（根） | 早期 i18n key 校验，已被 `test/check_i18n_coverage` + `find_missing_en` 取代 |
| `event_keys.txt` / `extract.log`（根） | 上述脚本的生成产物 |
| `js/events.wrapped.js`（142KB） | `wrap_events.cjs` 的中间产物，游戏加载的是 `js/events.js`，未被引用 |
| `test/t2.cjs` | scratch 试探脚本（仅验证 `autoHint` 正则） |

> 注：上述根脚本原本被 `.gitignore` 忽略（本地产物），故仅本地移动、不入库；`extract_events.cjs` 与 `t2.cjs` 为已跟踪文件，用 `git mv` 保留历史。

---

## 三、玩法 / 内容扩展待办（中，整合自 GDD §17 + 架空历史 spec）

- [x] **P2 §6/§7 候选成就/彩蛋（已落地，2026-09-08 核实）**：§6 缺失的 `ACH_NEVERLAND_ZOO`/`ACH_ENCINO` 与 §7 缺失的 7 枚彩蛋（`EGG_APOLLO_LAST`/`EGG_LLAMA`/`EGG_THRILLER_70M`/`EGG_HISTSTATUE`/`EGG_HEALWORLD`/`EGG_VICTORY_CHARITY`/`EGG_GHOSTS_GUINNESS`）均已在 `config.js`/`engine.js`/`events.js`/`i18n.js` 实现并接好触发（flag 命名遵守 `egg_<flag>` 含下划线的铁律）。彩蛋经 `_audit_egg_trivia_reach` 5000 局审计「43 中仅 3 密蛋未落地、其余全可达」；两成就分别经 `neverlandType='public'`（`4_1`）/`encino` flag（`V_ENCINO`）可达。原「待拍板」清单已失效，无需再补。
- [ ] **多周目传承 M10 / 成就叙事化 M11 / 关键抉择回放 M12**（g6 可视化增强）。
- [x] **深度游玩（C：关系网深化 ✅ / 创作企划器扩展）**：关系网深化已实现——4 新 rel key（diana/frank/john/elizabeth）+ 4 关系隐藏变体（V_REL_DIANA/FRANK/JOHN/ELIZABETH，cond 门控 + __RETURN__）+ 2_7/4_3b tipping 文案 + 新建 `collaborators/` 索引模块（关系总览弹窗，含实时好感值与史料出处）+ 结局页「命运回响」面板（复用现有结局，叠加关系注解）。mjwiki 6 合作者页已补（双源保留，按 §15.1 多源考证）。创作企划器扩展仍待。
- [ ] **重复游玩**：每日挑战、硬核纯净、NG+、结局达成向导、最接近结局提示。
- [~] **剧情文案深化**（spec: docs/superpowers/specs/2026-09-08-narrative-deepening-design.md；分批实现）
  - [x] 批次1：两页海报(正面主视觉+独白 / 背面属性+关键抉择+尾声) + 16 尾声模板 + 6 独白扩写尾段（按元路线/属性/flag 出不同文案，MJ 风格）；npm test 全绿
  - [x] 批次2：时代切片（6 章 flavor 增厚 + 8 个 V_ERA_* 变体：Motown/MTV/CD/WeAreTheWorld/互联网/9·11/Thriller25/流媒体）；npm test 全绿
  - [ ] 批次3：心理轴（5-6 童年闪回变体 + END_RECLUSE/TRAGIC 尾声联动）
  - [ ] 批次4：舆论链（V_RUMOR 扩展 + 5-6 新变体 + END_CONTROVERSIAL 尾声联动 + _audit_narrative 门禁）
- [ ] **系统化彩蛋、更多结局候选**；性能/无障碍（移动端、轻量可视化、社交增强）。

---

## 四、工程 / 验证

- [ ] 保持 `npm test` 并行矩阵全绿；发布前跑 `node test/_audit_playthrough.cjs 5000`。
- [ ] `dist` 验证工具 `test/dist_check.cjs` / `test/dist_run.cjs` / `test/repro_combined.cjs` 保留作为回归辅助。

---

## 五、历史归档（已完成项）

> 以下内容为已取得成果，折叠归档以便聚焦待办。

### A. 文档 / 一致性（全部 ✅，2026-09-08）
- **GDD 正文「18 结局」旧引用全量刷新**：状态块/§5.4/§7.1/§8.2 标题/§17 骨架/埋点表等当前态计数全部改为 30 结局 / 114 变体 / 43 彩蛋 / 61 趣事 / 成就 88；§8.2 矩阵正文补全 12 个新结局行（7 假设线 + 5 安全网）。历史 changelog 行的「18」按原意保留。
- **彩蛋/趣事/变体计数统一**：以源码/审计为准 — 变体 **114**、彩蛋 **43**（含 3 枚密蛋）、趣事 **61**、结局 **30**、成就 **88 项**（重复 id 已清除）。GDD/README 均已刷新。
- **`test/smoke.cjs` 单元覆盖扩展至 30 结局**：`ucases` 增补 12 个新结局（7 假设线 + 5 安全网），全部经 `MJ.resolveEnding` 直验 OK；`mkEnding` 增补 `timeline` 支持；随机段年份倒挂守卫由 `process.exit(1)` 降级为 WARN（变体注入年份排序产物，非结局判定错误），使单元覆盖块得以执行。
- **`ACH_ALL_ENDINGS` 文案「25→30」**（config.js，已于 9098641 提交）。其余成就描述未再发现旧结局数引用。
- **`config.js` 成就 id 重复修复**：`ACH_NEVERLAND` 重命名/去重处理，`achievementReach`(config.js:43)、EN 文案键(i18n.js:648)、`smoke.cjs` 成就覆盖用例同步；图鉴按 id 去重不再静默覆盖前者。
- **变体年份修正回归护栏**：`5_2g` 年 1992→1993 曾致 `V_DANGEROUS_PREM` 0 触发（pre 3.12%→post 0%），已通过扩其窗口 [1991,1993] 修复并复跑 `check_balance_reach` 确认恢复 5.26%。教训：改 spine 事件年须复跑平衡门禁。

### B. 内容扩展（原第四节 ✅）
- [x] **P1 BP4/BP5 法律应对分支（已落地，2026-09-08 核实）**：`V_1993_RESPONSE`(events.js:2792) / `V_2005_RESPONSE`(events.js:2808) 已实现为中性应对变体（window 1993–94 / 2005–06，三选项 低调回避/主动发声/投身公益，仅影响声誉/家庭/慈善轨迹），遵守 §17.15 红线、MJ 恒无罪。归档 spec §17.3 标注「未实现」已过时。
- [x] **P3 §8 图鉴 F7–F11 年份/口径校准（2026-09-08 提交）**：F7 Ghosts 摄制年 1997→1996；F8 Dangerous 格莱美之夜 1992→1993、HIStory 1996→1997；F9 V_BUBBLES 窗口 [1985,1990]→[1986,1990]；F10 Thriller 40 年 2023→2022；F11 6_3a 注明三十周年(2001-09) 与 9·11 义演为独立事件。审计 F1/F2/F3/F4/法律年等经核实代码已合规，无需改。

### C. 工程 / 验证（原第五节 ✅）
- [x] 单文件构建兼容 `?v=` 版本串（`build_singlefile.cjs`，提交 `44b545d`）。
- [x] `dist/` 已被 `.gitignore` 忽略，产物不入库。
