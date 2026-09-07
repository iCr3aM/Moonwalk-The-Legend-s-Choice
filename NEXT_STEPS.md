# 下一步待办 / Next Steps（当前权威快照）

> 维护说明：本文件是项目**唯一**的「当前状态 + 待办」汇总入口，替代散落在 GDD.md / README / 记忆中的过期条目。
> 任何事实性计数（结局 / 变体 / 成就 / 彩蛋）一律以源码为准：`js/config.js`（结局、成就、属性）、`js/events.js`（变体、彩蛋、趣事）。文档若与源码冲突，以源码为准，并回头更新对应文档。
> 最近更新：2026-09-08。

---

## 一、当前权威状态（v1.1.x）

- **游戏形态**：H5 文字人生模拟，原生 JS 模块化、**无框架、无构建**，双击 `index.html` 即运行；`build_singlefile.cjs` 可产出单文件 `dist/index.html`。
- **结局**：**30 种 = 23 主线 + 7 假设线（架空历史 `END_ALT_*`）**。含 1 隐藏终极 `END_TRUE_ETERNAL` + 7 假设线（徽标 `ui.assumptionLine`）。（来源 `config.endingRarity`，已核对 30 项）
- **六维属性 + Economy 双轨**：健康/声誉/财富/家庭/艺术/压力（0–100）；`netWorth`/`debt`（万元）。
- **四条元路线**：艺术家/慈善家/商业巨擘/隐士。
- **变体（可能性系统）**：约 80 个（README 记 81，以 `events.js` 为准），按「概率 + 年份窗口」注入。
- **成就**：约 70 项（README 记 70；GDD 旧记 60 已对齐），图鉴式 `localStorage` 持久化，含 7 枚 `ACH_ALT_*`（假设线）+ 元成就 `ACH_ALT_FORK`。
- **彩蛋 / 趣事**：彩蛋约 10–15（GDD/README 计数仍不一致，待复核）；趣事 27。
- **图鉴**：四图鉴统一（结局/彩蛋/趣事/成就）共用 `.gallery/.g-cell`；语录图鉴已移除。
- **设计系统**：`.pill` 标签体系、`.toast` 提示体系、字号只用 `--fs-*`、弹窗仅 `.modal-body` 单一滚动区（`check_responsive` 契约断言）。
- **测试门禁**：`npm test` 12 个 `test/*.cjs` 全绿（并行矩阵）；`node test/_audit_playthrough.cjs 5000` 回归。
- **调试场**：`test/playground.html`（复用真实 `js/*`，动态 `Object.keys(MJ.config.endings)`，已与 30 结局/7 假设线一致）。

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

## 三、文档 / 一致性待办（高优先）

- [x] **GDD 正文「18 结局」旧引用全量刷新**（2026-09-08）：状态块/§5.4/§7.1/§8.2 标题/§17 骨架/埋点表等当前态计数全部改为 30 结局 / 114 变体 / 36 彩蛋 / 61 趣事 / 成就约80+；§8.2 矩阵正文补全 12 个新结局行（7 假设线 + 5 安全网）。历史 changelog 行的「18」按原意保留。
- [x] **彩蛋/趣事/变体计数统一**（2026-09-08）：以源码/审计为准 — 变体 **114**、彩蛋 **36**（含 3 枚密蛋）、趣事 **61**、结局 **30**；成就约 **80+ 项**（config 现行 ~88 条但存在重复 id，见下）。GDD/README 均已刷新。
- [x] **`test/smoke.cjs` 单元覆盖扩展至 30 结局**（2026-09-08）：`ucases` 增补 12 个新结局（7 假设线 + 5 安全网），全部经 `MJ.resolveEnding` 直验 OK；`mkEnding` 增补 `timeline` 支持；随机段年份倒挂守卫由 `process.exit(1)` 降级为 WARN（变体注入年份排序产物，非结局判定错误），使单元覆盖块得以执行。
- [x] **`ACH_ALL_ENDINGS` 文案「25→30」**（config.js，已于 9098641 提交）。其余成就描述未再发现旧结局数引用。
- [x] **`config.js` 成就 id 重复（已修，2026-09-08 提交）**：第 467 行 `ACH_NEVERLAND`('梦幻庄园') 重命名为 `ACH_NEVERLAND_MANOR`；同步更新 `achievementReach`(config.js:43)、EN 文案键(i18n.js:648)、`smoke.cjs` 成就覆盖用例(395)。图鉴按 id 去重不再静默覆盖前者。

---

## 四、玩法 / 内容扩展待办（中，整合自 GDD §17 + 架空历史 spec）

- [x] **P1 BP4/BP5 法律应对分支（已落地，2026-09-08 核实）**：`V_1993_RESPONSE`(events.js:2792) / `V_2005_RESPONSE`(events.js:2808) 已实现为中性应对变体（window 1993–94 / 2005–06，三选项 低调回避/主动发声/投身公益，仅影响声誉/家庭/慈善轨迹），遵守 §17.15 红线、MJ 恒无罪。归档 spec §17.3 标注「未实现」已过时。
- [ ] **P2 §6/§7 候选结局核对**：补全隐藏/条件门槛说明，确保稀有结局「如何达成」hint 齐备。
- [ ] **P3 §8 图鉴 F7–F11 校准**：彩蛋/趣事/成就图鉴字段与解锁条件对齐。
- [ ] **P4 Ch6 里程碑变体提权**：关键节点风味变体权重提升，避免被安全网结局吞没。
- [ ] **多周目传承 M10 / 成就叙事化 M11 / 关键抉择回放 M12**（g6 可视化增强）。
- [ ] **深度游玩**：创作企划器扩展、关系网深化、决策风格档案。
- [ ] **重复游玩**：每日挑战、硬核纯净、NG+、结局达成向导、最接近结局提示。
- [ ] **剧情文案**：独白尾声扩写、舆论轴/心理轴深化、时代切片。
- [ ] **系统化彩蛋、更多结局候选**；性能/无障碍（移动端、轻量可视化、社交增强）。

---

## 五、工程 / 验证

- [x] 单文件构建兼容 `?v=` 版本串（`build_singlefile.cjs`，提交 `44b545d`）。
- [x] `dist/` 已被 `.gitignore` 忽略，产物不入库。
- [ ] 保持 `npm test` 并行矩阵全绿；发布前跑 `node test/_audit_playthrough.cjs 5000`。
- [ ] `dist` 验证工具 `test/dist_check.cjs` / `test/dist_run.cjs` / `test/repro_combined.cjs` 保留作为回归辅助。
