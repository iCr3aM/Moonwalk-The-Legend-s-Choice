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
- **UI**：稀有度五档颜色体系（CSS `--r-*` = `RARITY_COLORS` = 海报 canvas 三方对齐）、violet/teal 语义色 token 化、可访问性（键盘可达/aria-live/viewport 缩放/对比度 AA）、多设备截图工具 `test/_ui_screenshots.cjs`；**手机自适应字体**：七档 `--fs-*` 改 clamp 流体排版（375px 基准 / 320px 缩 1.5–4px / ≥430px 复原）。
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
**当前无进行中待办**：下一阶段从 §四 暂缓清单取项（建议先做发布前验证：5000 局回归 + Playwright e2e）。

---

## 四、暂缓（用户指示，恢复时间待定）

- [ ] **海报留白内容方案 A–E**：A 人生年轮（Face1 时间轴）/ B 六维星环（Face1 雷达）/ C 同行者剪影（Face2 合作者行）/ D 本程之最（Face2 三个最）/ E 元路线四相（Face2 meta 条）。成本 C/D/E 小，A/B 中。
- [ ] **多周目传承 M10 / 关键抉择回放 M12**（M11 成就叙事化已落地）。
- [ ] **重复游玩**：每日挑战、硬核纯净、NG+、结局达成向导、最接近结局提示。
- [ ] **系统化彩蛋、更多结局候选**；性能/无障碍深化（移动端、轻量可视化、社交增强）。
- [x] **发布前验证（2026-09-09 已完成，全绿）**：`node test/_audit_playthrough.cjs 5000` → PASS（矛盾局=0 / 悬空链接=0 / 粘性 debt=0）；`npm run e2e` 随机 **6/6**、`npm run e2e:endings` **30/30**、`npm run e2e:eggs` **43/43**，三种模式均 **0 console ERROR、0 WARNING**。
- [ ] **violet/teal 主题化延伸**（可选）：章节配色体系（`--gold` 六章色）是否扩展覆盖 violet/teal 语义色。

---

## 五、工程 / 验证（维护铁律）

- [x] `npm test` **30 门禁**并行矩阵全绿（2026-09-09 实测 EXIT=0；`check_syntax`、`check_gitignore` 已入矩阵）。
- 新增门禁一律遵守「信息型门禁=虚假通过」铁律：必须 `process.exit(1)` 才算 FAIL，结论须来自真实引擎调用。
- 新增门禁须同时登记 `run_parallel.cjs` GATES 数组与 `package.json test:serial`（两处）。
- 改 spine 事件年份须复跑 `check_balance_reach`；新增人物文案须过 `_audit_person_consistency`（初遇加 INTRO_WHITELIST）。
- 新增 js 模块同步三处清单：`index.html`、`build_singlefile.cjs`、test harness require。
- UI 改动后跑 `node test/_ui_screenshots.cjs`（4 设备 × 双语实机截图 + 溢出检测）。
- css/js 改动后 bump `index.html` 资源版本串（当前 css `?v=1.1.4`）。
- 批量改文件脚本：中文文件名/中文锚点必须用 UTF-8 临时 .cjs（PowerShell 内联必乱码）；删除代码块的结束锚必须选唯一地标行，禁用 `trim()==='}'`。
- 命令行传中文给 node -e 会 GBK 乱码 → 一律临时脚本文件。
- **`.gitignore` 不得忽略已入库内容**（2026-09-09 修正）：`test/`（52 个门禁脚本）与 `archive/`（归档文档）此前整目录被 ignore，但**早已被 git 跟踪并推到远端** → 属「远端出现已忽略文件」。已移除这两条 ignore 规则，只忽略真正的产物目录（`test/_ui_shots/`、`test/_e2e_shots/`、`test/_e2e_report.json`）。自检命令：`git ls-files -i -c --exclude-standard`（列出「已跟踪但被忽略」）必须为空。

---

## 六、归档指针

- **archive/**（根，入库）：
  - `GDD_v1.13.md`（原 GDD.md，132KB 权威设计源 → 已由本文件 + 源码取代）
  - `架构设计_v0.3蓝图.md`（v0.3 原型期迁移蓝图，已全部实现）
  - `NEXT_STEPS_2026-09-08.md`、`NEXT_STEPS_2026-09-09.md`（本文件历史快照）
- **docs/**（本地不入库）：`superpowers/specs/archive/`（全部 8 个已完成 spec）、`audit/archive/`（BALANCE / CODE_AUDIT 2026-09-08）；现行审计均转为常驻门禁。
- `archive/legacy-scripts/`、`archive/迈克尔·杰克逊：人生选择_原型归档.html`（早期原型）。
