# 下一步待办 / Next Steps（当前权威快照）

> 维护说明：本文件是项目**唯一**的「当前状态 + 待办」汇总入口（2026-09-09 起取代 GDD.md / 散落文档；旧文档已全部归档，见 §六）。
> 任何事实性计数（结局 / 变体 / 成就 / 彩蛋）一律以源码为准：`js/config.js`（结局、成就、属性）、`js/events.js`（变体、彩蛋、趣事）。文档若与源码冲突，以源码为准。
> 最近更新：2026-09-09（UI 优化环节收官 + 旧文档归档 + 手机自适应字体落地 + .gitignore 与已跟踪文件一致性修正）。

---

## 一、当前权威状态（v1.15）

- **游戏形态**：H5 文字人生模拟，原生 JS 模块化、**无框架、无构建**，双击 `index.html` 即运行；`build_singlefile.cjs` 可产出单文件 `dist/index.html`。
- **结局**：**30 种 = 23 主线 + 7 假设线**，含 1 隐藏终极 `END_TRUE_ETERNAL`。
- **变体（可能性系统）**：**141 个**；**成就 89**、彩蛋 **43**（含 3 密蛋）、趣事 **61**。
- **文案系统**：手记 6 章 × 多分支（含第六章）、命运回响 12 条、假如…微片段 7 组、尾声彩蛋 20 条、成就叙事 40 条——全部模板键 EN 全量（门禁第四阶段自动收集）。
- **UI**：稀有度五档颜色体系（CSS `--r-*` = `RARITY_COLORS` = 海报 canvas 三方对齐）、violet/teal 语义色 token 化、可访问性（键盘可达/aria-live/viewport 缩放/对比度 AA）、DOM 计数自愈（`data-cnt` + `refreshCounts()`，修「删档案/重置图鉴后数量滞后」）；多设备截图工具 `test/_ui_screenshots.cjs`；**手机自适应字体**：七档 `--fs-*` 改 clamp 流体排版（375px 基准 / 320px 缩 1.5–4px / ≥430px 复原）。
- **测试门禁**：`npm test` **30 个** `test/*.cjs` 全绿（并行矩阵，EXIT=0 为真绿）；新增 `check_syntax`（js/ 全模块 node --check，堵住「无浏览器加载路径」盲区）、`check_gitignore`（禁止「已跟踪但被忽略」的文件进入远端）。
- **文档**：根目录仅剩 `NEXT_STEPS.md` + `README.md/README_EN.md`（门面）；GDD/架构设计等已归档（§六）。

---

## 二、✅ 已收官：逻辑一致性审计（2026-09-09）

> A 关系网结识门控 / B 具名人物全遍历 / C flag 写-读闭合 / D 结局文案一致性 / E 硬约束矩阵——五门禁常驻 `npm test`。明细见 `archive/NEXT_STEPS_2026-09-09.md`。

## 二·五、✅ 已收官：UI 优化与排版环节（2026-09-09）

- [x] **U1 稀有度颜色体系**：五档色板（common 灰金 / uncommon 铜 / rare 金 / epic 紫 / legendary 亮金）+ epic/legendary 辉光；图鉴/成就 toast/结局页 pill 全着色；canvas 3 处映射收敛为 `RARITY_COLORS` 并补 uncommon。
- [x] **U3 全站巡检 17 条**（工具脚本子代理产出）分 6 批处理：
  - ①语言正确性：事件卡「年」后缀 i18n（`EN_EMPTY_OK` 门禁白名单新机制）、命运回响人名、人物志 EN 姓名重复。
  - ②溢出防护：`.btn.block` 移动端放开 nowrap、`.modal-head .btn` 防折行、`.ending/.era-card` 移动端留白统一 20/14（#4 海报按钮行实测未触发保持）。
  - ③可访问性：viewport 去缩放禁用、图鉴卡片/海报缩略图键盘可达（Enter/Space）、kmore 触达、`--danger-bright` 对比度 AA、toast `aria-live`。
  - ④Canvas 英文：`wrapParagraph`/`wrapCenter` EN 按空格分词（`_audit_poster_quotes` 同步口径）。
  - ⑥死代码：`createPoster`+`wrapText`+`_lastPosterQuote` ~300 行删除（ui.js 1775→1487）；死 CSS 11 处；被覆盖 transition 合并；圆角/padding token 化；`.epilogue` 金色归一。
  - 用户拍板维持：#7 卡内滚动（实测仅 6px）、#16 桌面端五档 padding。
- [x] **多设备实机截图验证**：`test/_ui_screenshots.cjs`（4 设备 × zh/en × 7 场景 + 溢出自动检测）；**抓到 ui.js 被批量脚本切坏而 28 门禁全绿的盲区故障** → 新增 `check_syntax` 门禁（矩阵 28→29）。教训：批量删代码结束锚禁用 `trim()==='}'`；UI 改动必跑截图脚本。

---

## 三、✅ 已落地：手机屏幕自适应字体（方案一 clamp，2026-09-09）

> 需求：根据手机屏幕大小自适应字体大小。现状：`:root` 七档字号 token（`--fs-xs 11px` … `--fs-display 26px`）全站引用，但 320px 小屏与 430px 大屏手机**同字号**；640px 媒体查询只覆盖部分组件。

### 方案一（推荐）：clamp 流体排版 —— 只改 `:root` 7 行，全站生效

以 375px 宽为标准基准（当前值），320px 最小屏线性缩小约 1.5–4px，≥430px 恢复标准值：

| token | 现值 | 改为 | 320px 实际 |
|---|---|---|---|
| `--fs-xs` | 11px | `clamp(10px, 2.93vw, 11px)` | 10px |
| `--fs-sm` | 12px | `clamp(10.5px, 3.2vw, 12px)` | 10.5px |
| `--fs-md` | 13px | `clamp(11.5px, 3.47vw, 13px)` | 11.5px |
| `--fs-base` | 15px | `clamp(13.5px, 4vw, 15px)` | 13.5px |
| `--fs-lg` | 17px | `clamp(15px, 4.53vw, 17px)` | 15px |
| `--fs-xl` | 22px | `clamp(19px, 5.87vw, 22px)` | 19px |
| `--fs-display` | 26px | `clamp(22px, 6.93vw, 26px)` | 22px |

- **零组件改动**：全站字号引用 token，改 7 行自动生效；`body.lang-en` 微缩规则、640px 媒体查询均引用 token，天然兼容。
- **不影响 canvas 海报**（固定 1080 画布、硬编码 px，缩放显示，无需改）。
- **验证**：复跑 `test/_ui_screenshots.cjs` 对比 320/360/430 三档 + 真机目检；注意 fs-xs 下限 10px 可读性（EN 长词已有 word-break 防溢出）。
- 成本：CSS 7 行 + 截图验证，半小时级。

### 方案二（备选）：360px 断点分档

在 640px 媒体查询基础上加 `@media (max-width: 360px)` 整体下调一档 token。改动 8 行；缺点是 361px 处有跳变、不如 clamp 平滑。

### 方案三（不推荐）：全站 rem 化

px→rem 大改（style.css 700+ 行），收益不成比例。

**拍板结果（2026-09-09）**：采用方案一，按上表七档 clamp 值落地（`css/style.css` `:root` 改 8 行 + `index.html` css 版本串 `?v=1.1.4→1.1.5`）。验证：`npm test` 29/29 绿；`node test/_ui_screenshots.cjs` 4 设备（320/360/375/768）× 双语「无水平溢出、无 pageerror」。`--fs-xs` 下限维持 10px（图鉴 desc 已 line-clamp，未放宽）；后续如需放大只调 clamp 的 min 值。

---

## 三·五、✅ 已落地（阶段 A+B）：violet / teal 主题化延伸（2026-09-09）

> 用户从暂缓清单挑出该项要求先出方案。完整 spec：`docs/superpowers/specs/2026-09-09-violet-teal-theme-extension.md`（docs 本地不入库）。

**现状基线（实测 grep）**：U3#14 已建 12 个语义色 token，但**消费点只有 5 处**（toast×2 / pill×2 / vignette×1）；`.app[data-chapter=N]` 六章目前只覆写 `--gold/--gold-soft/--gold-dim/--line` —— 这正是零成本杠杆：violet/teal 走同一套「变量覆写」即可自动随章节变色，零 JS、零组件改动。

**语义约定**：violet = 假设 / 虚构 / 未知 / 彩蛋；teal = 趣事 / 假如… / 平行想象；gold 保留给主线 / 成就 / 权威数值。验收口径：**不看文字只看颜色就能分辨「史实主线 / 假设虚构 / 趣味旁支」**。

**分阶段**：

- **A 语义色随章节走**（推荐先做，18–24 行 CSS，半小时级）：六章规则追加覆写 `--violet/--violet-border/--teal`；要点是必须与章色**拉开明度**——ch1 本就靛紫、ch3 本就青绿，否则假设线 pill 会「隐身」。
- **B 补未覆盖场景**（1–2h，5 处→约 12 处）：`.g-prog` 按图鉴类型着色（彩蛋 violet / 趣事 teal）；`.era-block .e-tag` 按内容类型（手记 gold / 回响 violet / 假如 teal）；未解锁卡片按类型描边（**只换色相，不动「虚线 + opacity .55」这套未解锁语言**）；人物志未结识走 violet。
- **C canvas 海报跟随**（半天）：canvas 不吃 CSS 变量，需把 `js/ui.js` 硬编码色表抽成 `MJ.THEME_COLORS`。
- **D 玩家可选主题**（1 天+）：需新建设置面板 + i18n 键 + 持久化，建议等 A/B 反馈再定。

**拍板结果（用户：可以做，按建议做 A+B，C/D 暂缓）已落地（css `?v=1.1.6`）**：

- **A 语义色随章节走**：六章 `.app[data-chapter=N]` 各追加 4 变量覆写（`--violet/--violet-border/--teal/--teal-border`）；取值原则 = 语义色比章色**更亮**——ch1/ch4 本就偏紫、ch3 偏青绿，语义色取近白高明度，避免小面积 pill「隐身」。全部消费点（toast/pill/vignette/图鉴进度）零改动自动跟随。
- **B 补场景（5 → 约 11 处）**：①图鉴进度按类型着色：`.egg-gallery .g-prog`=violet、`.trivia-gallery .g-prog`=teal、结局/成就保持 gold；②未解锁卡片按类型描边：`.g-cell.off` 只换 border-color，**虚线 + opacity .55 语言不动**；③内容类型着色：手记 gold / 命运回响 violet / 抉择的回响 violet（ui.js era-block 加 `era-diary`/`era-echo` 类，均已在 CSS 定义，过 `check_ui_classes`）；④人物志未结识 `.collab-card.locked` 描边 violet（仍虚线 + opacity .55）。
- **运行时验证（临时脚本实测后已删）**：default + 六章的 `--violet/--teal` computed 值全部符合新值；egg/trivia 进度与未解锁描边着色生效；ach 进度保持原色；`.era-diary .e-tag` 深字金底生效（era-echo 同构）。
- 回归：npm test 30/30、随机 6/6、reset 16/16、截图 4 设备 × 双语无溢出无 pageerror。
- **暂缓**：C canvas 海报跟随（需把硬编码色表抽成 `MJ.THEME_COLORS`）、D 玩家可选主题（需设置面板）。
- **目检提醒**：色彩与对比度的最终确认需人眼看 `test/_ui_shots/` 截图（4 设备 × 双语 × 7 场景），模型无法读图；若某章下 pill 与章色仍觉得近，调对应章的 `--violet/--teal` 覆写值即可。

---

## 三·六、✅ 已落地：图鉴重置语义（冻结到新局，2026-09-09）

> 用户报告「重置图鉴后开始游戏会自动弹出成就解锁」。完整复现数据与方案：`docs/superpowers/specs/2026-09-09-codex-reset-semantics.md`（docs 本地不入库）。

**实测结论**：
- 「重置 → 开**新**局」**不会**多弹（新局 20 步 3 个成就 = 未重置基线，属正常收集；第二局 0 个，已解锁不重弹正确）→ **新档无此 bug**。
- 「重置 → 继续**旧存档**」**必现复活**：成就 7→0→**9**、彩蛋 1→0→**2**、趣事 0→0→**2**（重置等于白做）。结局图鉴不复活，行为正确。
- **弹窗从哪来**：`resume()` 的 `_suppressAchToast` 用 `try/finally` 立即释放，只在续档首屏**恰好是事件页**时静默；首屏若是章节过场卡（`showEraCard` 不 evaluate）则静默作废，`showEnding` 的 evaluate 更是完全不检查 → 那批复活的成就连弹（每个 3s 串行）。
- **顺带查出**：`MJ.ui.toastEgg` / `toastTrivia` 从未挂载（实测 undefined）→ **彩蛋/趣事的解锁提示从来没出现过**。

**分类矩阵（只重置一个时怎么算）**：结局图鉴不复活 ✅；成就每屏 `evaluate(state)` 复活 ❌；彩蛋走 `egg_*`+孤儿 flag 复活 ❌；趣事走 `tidbit_*`+`revealAll` 复活 ❌。建议规则：已解锁成就只增不减；重置某类只影响该类；重置=当前存档周期内该类不再解锁。

**方案**：①**冻结到新局**（推荐，`clear()` 置 `_frozen`，`engine.start()` 解冻，约 15 行，重置才真归零）；②静默基线（重置后静默补齐本局已达成的，不归零，不推荐）；③只修 suppress 窗口（治标，但窗口错位本身是独立缺陷，建议与 ① 合并）。

**拍板结果（用户定：方案一 + 只冻该类 + 修 toast）已落地**：
- `achievementSystem / eggSystem / triviaSystem` 各加 `_frozen`：`unlock()` 冻结期间直接 return false（不写库、不提示）；`clear()` **不冻结**（测试与程序化清理仍走纯清除），冻结点在 UI：重置按钮走 `clear() + freeze()` 组合。
- 解冻点唯一：`MJ.engine.start()` → `MJ.unfreezeCodexSystems()`（开新人生恢复收集）；续旧档保持冻结。
- 成就 `evaluate` 改为按 `unlock()` 返回值入列（否则冻结时仍会 push → 照弹）。
- 重置后弹中性提示 `ui.resetFrozenHint`（新 i18n 键，EN 已补）：「已重置：本局内不再记录，开始新人生后恢复收集」——冻结行为对玩家不可见，不提示会像 bug。
- **顺手修**：`ui.toastEgg` / `ui.toastTrivia` 导出（此前从未挂载 → 彩蛋/趣事解锁一直无提示）。
- 验证：新增 e2e 第五模式 `npm run e2e:reset`（16/16）——重置→归零且 `_frozen=true`；续旧档后计数仍 0、无解锁 toast；开新人生后三类解冻且成就重新收集。**反向验证**：临时停用成就冻结检查 → `ach-no-revive-on-resume` FAIL（期望 0 实际 6），确能抓回归。
- 全量回归：npm test 30/30、随机 6/6、endings 30/30、eggs 43/43、counts 9/9、reset 16/16、多设备截图无溢出。index.html js `?v=1.1.2→1.1.3`。
- **遗留（未做，方案③）**：`resume()` 的 `_suppressAchToast` 用 `try/finally` 立即释放，续档首屏若是章节过场卡/结局页则静默失效；`showEnding` 的 evaluate 完全不检查该开关。冻结已覆盖「重置」场景，正常续档无已解锁项可重弹，故未改——若日后出现非重置场景的续档弹窗，按方案③修。

---

## 四、暂缓（用户指示，恢复时间待定）

- [ ] **海报留白内容方案 A–E**：A 人生年轮（Face1 时间轴）/ B 六维星环（Face1 雷达）/ C 同行者剪影（Face2 合作者行）/ D 本程之最（Face2 三个最）/ E 元路线四相（Face2 meta 条）。成本 C/D/E 小，A/B 中。
- [ ] **多周目传承 M10 / 关键抉择回放 M12**（M11 成就叙事化已落地）。
- [ ] **重复游玩**：每日挑战、硬核纯净、NG+、结局达成向导、最接近结局提示。
- [ ] **系统化彩蛋、更多结局候选**；性能/无障碍深化（移动端、轻量可视化、社交增强）。
- [x] **发布前验证（2026-09-09 已完成，全绿）**：`node test/_audit_playthrough.cjs 5000` → PASS（矛盾局=0 / 悬空链接=0 / 粘性 debt=0）；`npm run e2e` 随机 **6/6**、`npm run e2e:endings` **30/30**、`npm run e2e:eggs` **43/43**，三种模式均 **0 console ERROR、0 WARNING**。


---

## 五、工程 / 验证（维护铁律）

- [x] `npm test` **30 门禁**并行矩阵全绿（2026-09-09 实测 EXIT=0；`check_syntax`、`check_gitignore` 已入矩阵）。
- 新增门禁一律遵守「信息型门禁=虚假通过」铁律：必须 `process.exit(1)` 才算 FAIL，结论须来自真实引擎调用。
- 新增门禁须同时登记 `run_parallel.cjs` GATES 数组与 `package.json test:serial`（两处）。
- 改 spine 事件年份须复跑 `check_balance_reach`；新增人物文案须过 `_audit_person_consistency`（初遇加 INTRO_WHITELIST）。
- 新增 js 模块同步三处清单：`index.html`、`build_singlefile.cjs`、test harness require。
- UI 改动后跑 `node test/_ui_screenshots.cjs`（4 设备 × 双语实机截图 + 溢出检测）。
- css/js 改动后 bump `index.html` 资源版本串（当前 css `?v=1.1.5`、js `?v=1.1.3`）。
- 批量改文件脚本：中文文件名/中文锚点必须用 UTF-8 临时 .cjs（PowerShell 内联必乱码）；删除代码块的结束锚必须选唯一地标行，禁用 `trim()==='}'`。
- 命令行传中文给 node -e 会 GBK 乱码 → 一律临时脚本文件。
- **写到 DOM 里的数量必须能自愈**（2026-09-09 修复「删档案/重置图鉴后计数滞后，刷新才对」）：凡是把 `xxxCount()` 求值拼进 HTML 的地方，同一节点必须挂 `data-cnt="gallery|ach|egg|trivia|archive"`，并在数据源变更后调 `refreshCounts()`（落点：`wireReset` 的 doReset 之后、`closeOverlay` 兜底、三类解锁 toast）。新增计数务必走这套，别再写一次性求值。回归验证：`npm run e2e:counts`（真机跑两局→删档→重置四类图鉴，断言 DOM 值 === localStorage/系统真值；**实测停用修复时 6 项 FAIL**，确能抓到回归）。
- **`.gitignore` 不得忽略已入库内容**（2026-09-09 修正）：`test/`（52 个门禁脚本）与 `archive/`（归档文档）此前整目录被 ignore，但**早已被 git 跟踪并推到远端** → 属「远端出现已忽略文件」。已移除这两条 ignore 规则，只忽略真正的产物目录（`test/_ui_shots/`、`test/_e2e_shots/`、`test/_e2e_report.json`）。自检命令：`git ls-files -i -c --exclude-standard`（列出「已跟踪但被忽略」）必须为空。

---

## 六、归档指针

- **archive/**（根，入库）：
  - `GDD_v1.13.md`（原 GDD.md，132KB 权威设计源 → 已由本文件 + 源码取代）
  - `架构设计_v0.3蓝图.md`（v0.3 原型期迁移蓝图，已全部实现）
  - `NEXT_STEPS_2026-09-08.md`、`NEXT_STEPS_2026-09-09.md`（本文件历史快照）
- **docs/**（本地不入库）：`superpowers/specs/archive/`（全部 8 个已完成 spec）、`audit/archive/`（BALANCE / CODE_AUDIT 2026-09-08）；现行审计均转为常驻门禁。
- `archive/legacy-scripts/`、`archive/迈克尔·杰克逊：人生选择_原型归档.html`（早期原型）。
