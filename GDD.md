# 游戏设计文档（GDD）
## 《月球漫步：传奇的抉择》 Moonwalk: The Legend's Choice

> 文档修订说明（v0.6 · 敏感内容中性化）：
> - 在 v0.5 基础上**对敏感法律事件做中性化改写**：以程序性/法律术语（民事指控、刑事指控、逮捕程序、庭审结果、庭外和解、裁定无罪）替代定性表述，只对可考证的史实节点叙述，不预设有罪/无罪，判断交由玩家选择驱动（详见第十五章「内容中性化规范」）。
> - 此前 v0.5 已深度拓展：生平年表更细（新增 1964 组队、1969 Ed Sullivan、1976 CBS、1984 Victory 巡演、1988 Moonwalker、1993 Oprah 访谈、1995 Scream、1996 争议单曲、1997 Ghosts、1999 慈善演唱会、2001 30 周年、2003 Number Ones/被捕、2008 Thriller 25 等）。
> - **选项深化**：多数关键事件改为「三选」，引入权衡更尖锐的第三选项。
> - **新增「可能性系统 / 变体事件」**：随周目以概率插入的随机事件，保证每次游玩体验不同。
> - **新增四条元路线**：艺术家 / 慈善家 / 商业巨擘 / 隐士，由累积选择决定走向，解锁专属事件与结局。
> - **结局由 8 种扩充到 12 种**，新增隐居隐士、慈善圣人、商业巨擘、永恒符号等。
> - 技术架构详见 `架构设计.md`。
> - **v0.7（续章 + 18 结局 + 资产现实校准）**：新增「续章·假设 2009 未离世（2010–2026）」宏观架空时间线（事件 8_0–8_6，含 2016 索尼收购 Sony/ATV 半数股权、2026 传记片《Michael》玩家可选出演）；结局 12→14（新增续章 `END_TIMELESS_PRESENT`，M9 `END_TRUE_ETERNAL` 隐藏终极已落地）；资产初值校准为 0（盖瑞工人家庭出身）；成就扩至 30 项并加稀有度排序、图鉴/成就可重置。
> - **v0.8（规划扩展路线图）**：新增 §17.4–§17.10 规划——深度游玩（创作企划器 / 专项子维度 / 关系网深化 / 决策风格档案）、重复游玩（挑战·每日模式 / 纯净·硬核 / NG+ 轻量 / 结局达成向导）、剧情与文案拓展（独白尾声扩写 / 舆论轴·心理轴深化 / 时代切片）、更多结局候选（14→16~18，保持 §7.2 判定唯一）、更多生平补全事件与架空历史分支、系统化彩蛋（§17.9）、优化与性能提升（移动端 / 性能 / 可访问性 / 轻量可视化 / 社交增强）。凡架空内容遵循 §15.1 中性化规范与"明确标注架空"。以上为规划项，尚未实现。
> - **v1.0（内容拓展：主线补完 + 18 结局 + 生平补全）**：§17.3 主线偏薄章节补 `2_7`（Diana Ross 合作深化，单飞线 2_6→2_7→3_1）；§17.7 更多结局候选落地 4 个新结局（END_STATESMAN / END_INNOVATOR / END_MENTOR / END_RECLUSE_SERENE，14→18，§7.2 规则表插入位置遵循 1→N 唯一，各带稀有度成就）；§17.8 生平补全事件核实已落地（7 个 `V_BIO_*` 窗口变体 + 3_5《We Are The World》主线事件），并新增 `V_BIO_SBOWL`（1993 超级碗中场秀）。新增门禁 test/check_endings_new.cjs 与 test/check_bio_thin.cjs；npm test 全绿（18 结局解析、140 事件 0 中文残留、随机走查 0 异常）。
> - **v1.1（2019+ 续章内容设计草案 + 文档重组）**：新增「〇、实现状态总览」将已实现与待办分离；新增 §17.15 续章·2019+ 舆论与法律延续（设计草案·待落地），以 §15.1 中性化规范处理纪录片《Leaving Neverland》(2019) 与 Cascio 家族 2025–2026 诉讼等公开争议，仅作续章 `survived2009` 线事件设计，给出玩家多路径回应选项（沉默 / 声明 / 慈善 / 应诉 / 公开自证），并明确合规红线（不诽谤在世个人、不渲染未成年相关细节、不指名未成年当事人）。以上为规划项，尚未实现。
> - **v1.3（§17.11 趣事与轶事系统落地）**：新增 `MJ.triviaSystem`（24 条考据趣事图鉴，复用 localStorage + Toast 队列）、6 个 `V_TIDBIT_*` 轻量变体（深夜录音棚热可可 / 给 Bubbles 写日记 / 和侄子打游戏等，写入 `tidbit_*` 即时解锁图鉴）、hypothetical vignettes「假如…（想象）」（按主导元路线生成，结局页"人生手记"后独立面板）；趣事图鉴弹窗/计数/Toast 接入开场与结局菜单；EN 全量（`trivia.*`/`ui.*` 入 `i18n.js`，`event.V_TIDBIT_*`/`vignette.*` 入 `i18n_events_en.js`）。门禁 `check_variant_windows` 修正同变体自比较误报；`npm test` 全绿（147 事件、EN 残留 0、en_smoke 200 局 0 异常）。
> - **v0.9（续章深度拓展 §17.2 落实）**：将 GDD §17.2 全部候选节点落地——`8_1b` 全息归来 / `8_2b` 遗作《Xscape》 / `8_3b` 遗产税争议 / `8_5b` 舆论风波 / `8_4b`《MJ the Musical》 / `8_4c`《Thriller 40》周年 / `8_7` 留给后人的话，串入 `survived2009` 续章链路（共 14 节点）；新增续章专属变体池 `V_POST_*`（年轻一代翻唱致敬 / AI·全息巡演争议 / 家族内部版权争执，窗口 [2010,2026]）；`media`(媒体)/`loneliness`(孤独) 作为真实属性接入（含成就 `ACH_MEDIA_DARLING`/`ACH_LONELY`），使"影响媒体/孤独"生效；新增续章专属成就 `ACH_HOLOGRAM`(全息归来)/`ACH_MUSICAL`(百老汇音乐剧)。详见 §17.2 落地明细。
> - **v1.7（GDD 对齐 + 近期 UI/UX 方案，2026-09-04）**：将 GDD 对齐游戏现状——§〇 状态更新（成就 56 / 变体 65 / EN 全量 318 字段 / 五图鉴统一 / 章节主题配色 / 响应式多断点）、§8.2 扩为「十八结局可达性矩阵」（补 STATESMAN/INNOVATOR/MENTOR/RECLUSE_SERENE）；新增 §十八 近期 UI/UX 优化方案（结局页回顾分组、语录/彩蛋/趣事图鉴减列、主菜单英文居中、移动端填满核验、变体弹出频率与权重平衡、人生档案库、结尾海报增强 + 底部 credit）。代码侧已落地：语录/彩蛋/趣事图鉴减列（桌面 2 列/移动 1 列）、结局页回顾面板 2 列分组、海报底部「Cr3aM 制作 · MJ Forever」。

> - **v1.8（移除 MJ 语录图鉴，2026-09-04）**：用户质疑 MJ 名言/歌词准确性。核查：12 条中 6 条为逐字正确的歌曲歌词（Man in the Mirror / Heal the World / Billie Jean / Beat It / Thriller / Smooth Criminal），另 6 条为转述型"名言"（意译非原话，且把歌词当"名言"归类不当）。按"先去掉"意向，从 engine(MJ.quoteSystem) / ui(4 函数 + 2 按钮 + 2 监听 + 结局页注入) / i18n(12 词条 + 3 ui 键) / events(quote_mirror 标志) / test(check_i18n_coverage 语录组) 全量删除；EN 字段 318→306，五图鉴→四图鉴（结局/彩蛋/趣事/成就）。npm test 全绿。若未来重做，建议仅保留逐字歌词并标注出处。
> - **v1.9（结局稀有度进一步下调 + 英文补全，2026-09-05）**：用户反馈多数结局可达性偏低。① 稀有度在上一轮分档基础上再次整体下调——common 6 / rare 7 / epic 3 / legendary 2（仅 END_TRAGIC 与隐藏终极 END_TRUE_ETERNAL），取向转为"设计可达性/可达成感"而非纯随机命中率，`config.endingRarity` 与 §8.2 矩阵同步。② 补全结局英文：新增 18 个 `ending.END_*.hint` EN 键，并修复结局详情弹窗 `tone` 未走 `T()` 的中文回退 bug（name/tone/summary/monologue 英文键早已具备）。③ 重跑 `npm test` 与 `check_balance_reach` 确认 18 结局可达、无优先级抢占；lints 0、测试全绿。
> - **v1.10（结局真实可达性提升：轨迹优先重排 + dom 门控，2026-09-05）**：用户要求"随机玩也更容易撞见特殊结局"（真正提高 `resolveEnding` 可达性，非仅改标签）。① 重构 `resolveEnding` 为轨迹优先：烧伤/负债轨迹先于成功型结局判定，消除抢占；各路线型结局（MOGUL/INNOVATOR/PHIL/STATESMAN）要求该路线为主导（dom），使"无主导路线且健康声誉俱佳"的局流向 `PERFECT` 兜底。② 放宽门槛：ETERNAL(art75→66/rep65→56/health55→46)、STATESMAN(rep70→58/fam55→45)、MENTOR(collab2→1/fam50→40/art60→50)、ART_PEAK/TRAGIC(health40/35→28)、RECLUSE_SERENE(health55→50)、INNOVATOR(art80→70)；并修复 PERFECT 漏 `!debt`、RECLUSE_SERENE 曾宽于 RECLUSE、PHIL 降 phil3→2 吞 STATESMAN 等回归。③ 5000 局随机分布 15/18 出现，STATESMAN≈2.3%/ART_PEAK≈1.3%/TRAGIC≈2.1%/INNOVATOR≈3.9%/MOGUL≈4.1%/负债≈5%（上轮 PERFECT/STATESMAN/ART_PEAK/TRAGIC 仅≈0.04%）；PERFECT 在均匀随机为 0 属设计内禀（随机局多堆叠慈善→归 STATESMAN，其 hint 即"不走慈善、健康声誉俱佳"刻意玩法可达）。`npm test` 全绿、lints 0。

---

## 〇、实现状态总览（已实现 / 待办）
> 便于维护，将「已实现」与「规划/待办」分离。详细落地明细见 §17 各子节。

### 已落地（代码侧已验证）
- **结局体系**：18 种（含 1 隐藏终极 `END_TRUE_ETERNAL` + 1 续章 `END_TIMELESS_PRESENT`），§7.2 优先级规则表唯一判定。
- **续章（假设 2009 未离世）**：`8_0`–`8_6` + 深度拓展 `8_1b/8_2b/8_3b/8_5b/8_4b/8_4c/8_7`（共 14 节点），串入 `survived2009` 链路；续章专属变体池 `V_POST_*`（3 个）。【§17.2 ✅】
- **主线偏薄补强**：`2_7`(Diana Ross 合作深化)、`2_6` 格莱美加冕、`4_4` 后《Bad》时代。【§17.3 ✅】
- **更多结局候选**：`END_STATESMAN/END_INNOVATOR/END_MENTOR/END_RECLUSE_SERENE` 4 新结局 + 对应稀有度成就。【§17.7 ✅】
- **生平补全 + 架空分支 + 续章密度**：`V_BIO_*` 窗口变体（含 `V_BIO_SBOWL`）、`3_5` 等主线史实事件、多节点架空入口。【§17.8 ✅】
- **彩蛋系统**：8 个彩蛋 + 跨周目持久化 + 图鉴 + Toast。【§17.9 ✅】
- **创作企划器 + 格莱美涌现**：`planner.resolveGrammy` 六 era 全链路 + `ACH_GRAMMY_SWEEP/ACH_GRAMMY_LEGEND`。【§17.14 ✅ g6】
- **体验深化 M1–M9**：关系/NPC 好感、内心手记、时代卡片、命运回响、孤独维度、主题色、隐藏终极结局等。【§17.1 ✅】
- **其他**：成就 **56 项**（图鉴可重置）、关键选择回顾、社交分享（传奇海报 Canvas 保存/复制/分享）、**变体事件 65 个**（window+weight 年份窗口概率插入）、媒体/孤独属性、单文件构建与成就双发修复；**四图鉴统一**（结局/彩蛋/趣事/成就 共用 `.gallery/.g-cell` 卡片组件；语录图鉴已移除）、**章节主题配色**（ch0–ch5 各设主色）、**响应式多断点**（600/640/900/1080）、**Toast 串行队列**。【§16.1 ✅】
- **本地化（EN 全量）**：65 变体 + 56 成就 + 8 彩蛋 + 24 趣事 共 **306 字段**全部有 EN 词条（find_missing_en=0，i18n_coverage 测试通过；语录图鉴已移除，原 12 语录不再计入）。【§13 P1 ✅】

### 规划 / 待办（尚未实现）
- **多语言扩展（更多语种）**：在 EN 全量基础上扩展日/西等语种；数字/货币格式化、字体字距回退。【§13 P2/P3】
- **深度游玩系统**：专项子维度 / 决策风格档案 / 关系网 flavor 变体（创作企划器已于 §17.14 落地，本期补齐；§17.4 已落地）。【§17.4】
- **重复游玩增强**：挑战/每日模式、纯净/硬核、NG+ 轻量、结局达成向导、最接近结局提示（§17.5 无限暂缓）。【§17.5】
- **剧情与文案拓展**：MJ 语录/歌词系统 + 结局注入（§17.6 已落地；独白/舆论/心理轴深扩为后续）。【§17.6】
- **优化与性能**：移动端、性能、可访问性、轻量数据可视化、社交增强。【§17.10】
- **趣事与轶事系统**：Trivia Codex / `V_TIDBIT` flavor / hypothetical vignettes（§17.11 已落地）。【§17.11】
- **更多成就候选**：§17.12 候选表已落地（新增 14 项成就 + EN 全量）。【§17.12】
- **续章·2019+ 舆论与法律延续**：§17.15 已落地（8_5b 点名《逃离梦幻岛》+ 新增 8_9 Cascio 2025–2026 诉讼，接入 续章 8_5→8_9→8_7，EN 全量）。【§17.15】
- **无限期延迟**：M10 多周目传承 / M11 成就叙事化 / M12 关键抉择回放 / g6 UI 可视化增强（2026-09-04 用户决定）。

---

## 文档信息

| 项目 | 内容 |
| --- | --- |
| 文档版本 | 1.0（内容拓展：主线补完 + 18 结局 + 生平补全；实现态见 §17） |
| 游戏名称 | 《月球漫步：传奇的抉择》 |
| 英文名称 | Moonwalk: The Legend's Choice |
| 别名 | 《迈克尔·杰克逊：人生选择》（旧称）/ Michael Jackson: Life Choices（former） |
| 文档状态 | 修订版（规划架构对齐） |
| 目标平台 | H5（移动端优先，兼容桌面浏览器） |
| 游戏类型 | 人生模拟 / 文字冒险 |
| 目标时长 | 单周目 30~45 分钟 |
| 目标用户 | MJ 粉丝、人生模拟爱好者、音乐文化爱好者 |
| 语言 | 中文（可扩展多语言） |

---

# 一、玩法参考
1. BitLife（人生阶段+文字驱动，本作锁定 MJ 传记轨道）。
2. Reigns（二选一+多属性平衡+后果连锁）。
3. Enclaver RPG（纯文字人生叙事，本作更具传记性）。
4. 《一生之选》（阶段式，本作按 MJ 真实节点划分）。
5. 《人生重开模拟器》（多周目，本作分支更复杂 + 变体事件）。

---

# 二、游戏概念
## 2.1 一句话描述
玩家扮演迈克尔·杰克逊，在关键节点做选择，体验不同选择如何塑造一位传奇的完整人生。
## 2.2 核心理念
> 历史并非不可改变，每一个微小的选择都可能引发命运的蝴蝶效应。
## 2.3 愿景
对 MJ 粉丝深度沉浸；对模拟爱好者提供复杂决策系统；对普通玩家传递普世主题。

---

# 三、目标受众
核心 16~45 岁；次要 BitLife/Reigns 玩家、文化爱好者、移动休闲玩家。体验目标：低门槛、高重玩性、情感共鸣、认知收获。

---

# 四、故事与背景
## 4.1 世界观
忠实真实历史时间线，允许关键节点不同选择产生"平行历史"，只呈现后果不评判。
## 4.2 时间范围
1958 出生 → 2009 告别（或虚拟）。
## 4.3 叙事风格
第一人称"你"、客观中立、分支叙事（hint 预览不透露全局）。
## 4.4 主题
命运与自由意志 / 代价与成就 / 救赎与和解。

## 4.5 迈克尔·杰克逊生平全录（史实参考 · v0.5 细化）
| 年份 | 史实事件 | 游戏映射 |
| --- | --- | --- |
| 1958 | 8/29 生于盖瑞市，家中第 7 子（共 9 子） | start |
| 1964 | 正式加入"Jackson 5"与兄长同台 | 1_0* |
| 1963 | 5 岁显露歌舞才华，父亲严苛训练 | 1_1 |
| 1968 | 签约 Steeltown，发《Big Boy》 | 1_2 |
| 1969 | Ed Sullivan 秀亮相；签约 Motown，Diana Ross 引荐 | 1_2b* / 1_3 |
| 1970 | J5 前四首单曲接连登顶 | 1_4 |
| 1971 | 开始单飞，《Got to Be There》 | 1_5 / 1_6 |
| 1972 | 《Ben》主题曲获奥斯卡提名 | 1_7 |
| 1976 | J5 转投 CBS 改名"The Jacksons"，Randy 加入 | 1_8* |
| 1978 | 电影《新绿野仙踪》，结识昆西·琼斯 | 2_1 |
| 1979 | 《Off The Wall》发行；首做鼻子整形 | 2_3 / 2_2 |
| 1980 | 格莱美表演《Don't Stop》 | 2_5* |
| 1982 | 《Thriller》发行（史上最畅销） | 3_1 |
| 1983 | Motown 25 表演《Billie Jean》首秀月球漫步 | 3_1b |
| 1983 | 《Thriller》MV（John Landis）开 MV 时代 | 3_1c |
| 1984 | 1/27 百事广告头皮烧伤；获赔捐烧伤中心 | 3_2 / 3_4 |
| 1984 | Victory 巡演（与兄弟 reunion） | 3_2b* |
| 1984 | 凭《Thriller》独得 8 项格莱美 | 3_3 |
| 1985 | 《We Are The World》义援非洲 | 3_5 |
| 1985 | 4750 万美元购入 ATV 版权目录 | 3_6 |
| 1986 | 主演 3D 短片《Captain EO》 | 4_0 |
| 1987 | 购"梦幻庄园"Neverland | 4_1 |
| 1987 | 《Bad》发行；Bad 巡演 1987–1989（123 场） | 4_2 |
| 1988 | 自传《月球漫步》；电影《Moonwalker》/《Smooth Criminal》 | 4_3 / 4_2b* |
| 1991 | 《Dangerous》发行；《Black or White》 | 5_1 / 5_1b |
| 1992 | "危险之旅"巡演；创立 Heal the World 基金会 | 5_2 / 5_2b |
| 1993 | 1/31 超级碗中场秀 | 5_2c |
| 1993 | 2/10 Oprah 访谈（9000 万观众，公开白癜风） | 5_2d* |
| 1993 | 民事指控提出，1994 年约 2300 万达成庭外和解 | 5_3 / 5_4 |
| 1994 | 与 Lisa Marie Presley 结婚 | 5_5 |
| 1995 | 《HIStory》发行；《Scream》与 Janet（最贵 MV） | 6_1 / 6_1c* |
| 1995 | ATV 与索尼合并 Sony/ATV（各 50%） | 6_1b |
| 1996 | 《They Don't Care About Us》争议 / 《Earth Song》环保 | 6_1d* |
| 1996 | 与黛比·罗结婚，子 Prince、女 Paris 出生 | 6_2 |
| 1997 | 启动《Invincible》；混音集《Blood on the Dance Floor》 | 6_2b / 6_2c |
| 1997 | 短片《Ghosts》（Stan Winston） | 6_2d* |
| 1999 | "Michael Jackson & Friends"慈善演唱会（德/韩） | 6_2e* |
| 2001 | 《Invincible》发行；30 周年演唱会 | 6_3b |
| 2002 | 三子 Blanket 出生；柏林"坠婴" | 6_4b / 6_4c |
| 2003 | Bashir 纪录片播出；刑事指控与逮捕程序 | 6_4d / 6_4e* |
| 2005 | 庭审于 6/13 结束，全部罪名不成立 | 6_4 / 6_5 |
| 2006 | 梦幻庄园债务危机，Colony Capital 注资 | 7_1 |
| 2008 | 《Thriller 25》+ Grammy 亮相 | 7_0* |
| 2009 | 3/5 宣布《This Is It》50 场；6/25 离世 | 7_2 / 7_3 |

---

# 五、核心玩法
## 5.1 基本循环
阅读 → 决策（多为三选，含 hint）→ 反馈（属性即时变化，解锁/锁线）→ 推进 → 结局。
## 5.2 属性系统
健康70 / 声誉50 / 财富20 / 家庭60 / 艺术30 / 压力20（均 0–100）。平衡原则见第九章。
## 5.3 关键事件与分支
核心分歧（单飞、百事、庄园、两次指控、This Is It）、影响力事件（巡演/慈善/专辑投入）、象征事件（整容/结婚/坠婴）。另含**变体事件**（见 5.6）与**元路线**（见 5.5）。
## 5.4 结局系统
18 种结局（含 1 隐藏终极 + 1 续章结局），标志优先 + 属性阈值 + 元路线（见第七章）。
## 5.5 元路线（Meta-Path）系统 ★新增
玩家在全程的选择会累积出四条隐性元路线，决定中后段专属事件与可达成结局：
- **艺术家路线**（artPath）：持续高艺术投入 → 解锁《Ghosts》《Thriller 25》等，导向艺术/永恒结局。
- **慈善家路线**（philPath）：多次慈善参与（We Are The World + Heal the World + 1999 慈善） → 导向慈善圣人结局。
- **商业巨擘路线**（mogulPath）：收购 ATV + 索尼合并 + 追加收购 → 导向商业巨擘结局。
- **隐士路线**（reclusePath）：多次回避公众（Oprah 拒访、Bashir 拒拍、减少曝光） → 导向隐居隐士结局。
> 元路线非互斥但权重最高者生效；实现为隐藏计数器（如 `philCount`），由 `OutcomeResolver` 读取。

## 5.6 可能性系统 / 变体事件（Variation Events）★新增
为提升**重复游玩性与可能性**，在固定主线之外，以**概率 + 条件**插入随机微事件（每局不同）：
| 变体ID | 触发窗口 | 概率 | 示例内容 | 影响 |
| --- | --- | --- | --- | --- |
| V_OFFER | 1985–1990 | 50% | 神秘品牌天价代言邀约 | 财富+/声誉± |
| V_SCARE | 任意章节 | 30% | 突发健康惊吓（如晕倒） | 健康-，压力+ |
| V_PAPARAZZI | 1990–2005 | 40% | 狗仔围堵/私生饭事件 | 声誉±，压力+ |
| V_RUMOR | 1993/2003 前后 | 35% | 媒体谣言风波 | 声誉-，需应对 |
| V_COLLAB | 1995–2005 | 35% | 后辈歌手求合作（如 Britney/*NSYNC） | 艺术+/家庭+ |
> 实现：数据层事件加 `variant:true` + `weight`，`EventEngine` 在章节切换时按随机数决定是否插入。保证单周目主线完整，但"纹理"各异。（表中为 5 个设计示例；当前实现已扩至 **34** 个变体事件，含多个稀有门控隐藏/条件变体，详见 `js/events.js`。）

## 5.7 重玩性设计
18 结局（含 1 隐藏终极 + 1 续章）+ 变体事件 + 元路线 + 隐藏/条件事件 + 速通（1969 留盖瑞）+ 关键选择回顾。

---

# 六、事件与叙事结构

## 6.1 章节划分（v0.5 扩充）
| 章节 | 时间 | 已规划节点 |
| --- | --- | --- |
| 一、童年与 Jackson 5 | 1958–1976 | start,1_0,1_1,1_2,1_2b,1_3,1_4,1_5,1_6,1_7,1_8 |
| 二、单飞与 Off The Wall | 1978–1981 | 2_1,2_2,2_3,2_4,2_5 |
| 三、巅峰与裂痕 | 1982–1985 | 3_1,3_1b,3_1c,3_2,3_2b,3_3,3_4,3_5,3_6 |
| 四、Bad 与梦幻庄园 | 1986–1990 | 4_0,4_1,4_2,4_2b,4_3 |
| 五、Dangerous 与坠落 | 1991–1994 | 5_1,5_1b,5_2,5_2b,5_2c,5_2d,5_3,5_4,5_5 |
| 六、HIStory 与挣扎 | 1995–2005 | 6_1,6_1b,6_1c,6_1d,6_2,6_2b,6_2c,6_2d,6_2e,6_3,6_3b,6_4,6_4b,6_4c,6_4d,6_4e,6_5 |
| 七、告别与归宿 | 2006–2009 | 7_0,7_1,7_2,7_3 + 18 结局 |
| 八、续章·在场的不朽 | 2010–2026 | 8_0,8_1,8_2,8_3,8_4,8_5,8_6（仅 7_2 选「续写人生」进入） |

> 含变体事件与判定，总节点约 **92+**（主线 7 章 + 续章 7 节点 + 34 变体），达成设计目标 50–70+ 的饱和态。

## 6.2 叙事节奏
前两章轻快；第三章巅峰+伏笔；第四章中场；第五、六章密集冲突；第七章收束试炼。变体事件在冲突期插入，增强不确定性。

## 6.3 关键事件链
- 单飞线：1_5→1_6→2_4→Thriller/Bad 收益→索尼合并→艺术/历史结局。
- 健康线：3_2 百事→3_4 依赖→5_4 成瘾→存活/悲剧。
- 法律线：4_1 庄园→5_3(1993 民事指控)→6_4(2002 刑事指控)→6_5 庭审结果。
- 慈善线：3_5→5_2b→6_2e→philPath→慈善圣人结局。
- 商业线：3_6(ATV)→6_1b(索尼)→追加收购→mogulPath→商业巨擘结局。
- 隐士线：5_2d 拒访→6_4d 拒拍→reclusePath→隐居隐士结局。

## 6.4 完整事件节点目录（v0.6 · 含三选与新增）
> A/B/C = 选项；→ 跳转；[flag] 设标志；{△} 属性变化；money=经 Economy 子系统。*`*`=v0.5 新增*。

### 第一章
| ID | 年 | 标题 | 类型 | 选项 / 效果 | 跳转 |
| --- | --- | --- | --- | --- | --- |
| start | 1958 | 诞生 | 自动 | {family+5} | 1_0 |
| 1_0* | 1964 | 加入 Jackson 5 | 选择 | A 全力舞台 {art+10,family+5,stress+5} / B 守后方 {family+10} / C 童星压力逃避 {stress-5,family-5} | 1_1 |
| 1_1 | 1963 | 5 岁才华 | 选择 | A 全力训练 {art+15,family-10,stress+15} / B 适度 {art+5,family+5,stress+5} / C 抗拒严苛训练 {family-5,stress-10} | 1_2 |
| 1_2 | 1968 | Steeltown | 选择 | A 抓机会 {art+10,rep+10,stress+10} / B 谨慎 {art+5,family+5} | 1_2b |
| 1_2b* | 1969 | Ed Sullivan 亮相 | 选择 | A 惊艳全国 {rep+15,art+5,stress+10} / B 平稳表现 {rep+8} / C 紧张失误 {rep-5,stress+5} | 1_3 |
| 1_3 | 1969 | Motown/Diana Ross | 选择 | A 迁洛杉矶 {rep+15,wealth+10,family-5,stress+15} / B 留盖瑞 → END_PLAIN | 1_4 / END_PLAIN |
| 1_4 | 1970 | 四首登顶 | 自动 | {rep+15,wealth+15,art+10,stress+10} | 1_5 |
| 1_5 | 1971 | 是否单飞 | 选择 | A [isSolo=true] 单飞 {art+20,wealth+15,family-15,stress+15} / B [isSolo=false] 留兄弟 {family+20,art+5,wealth+5} / C [isSolo=false] 半单飞兼顾 {art+10,family+10,wealth+5} | 1_6 / 2_1 / 2_1 |
| 1_6 | 1972 | 早期个人专辑 | 条件(仅单飞) | A [soloAlbum1972=true] {art+15,wealth+10,family-5} / B [soloAlbum1972=false] {family+5,art+5} | 1_7 |
| 1_7 | 1972 | 《Ben》奥斯卡提名 | 选择 | A 出席 {rep+5,stress+5} / B 专注录音室 {art+5} / C 携宠物鼠营销 {rep+5,family+5} | 1_8 |
| 1_8* | 1976 | 转投 CBS"The Jacksons" | 选择(文本随 isSolo) | A 拥抱团体新起点 {family+10,art+5} / B 借机推个人 {art+10,rep+5} / C 与父决裂 {family-15,stress+10} | 2_1 |

### 第二章
| ID | 年 | 标题 | 类型 | 选项 / 效果 | 跳转 |
| --- | --- | --- | --- | --- | --- |
| 2_1 | 1978 | 《新绿野仙踪》 | 选择 | 单飞：A {art+15,rep+10} / B {family+10} / C 临时退演保隐私 {family+5,stress-5}；非单飞：A {art+10,family+5} / B {art+5,family+10} / C {family+15} | 2_2 |
| 2_2 | 1978 | 鼻整形 | 选择 | A {rep-5} / B {health+10} / C 多次整形 {rep-10,health-5,stress+5} | 2_3 |
| 2_3 | 1979 | 《Off The Wall》 | 自动(随 isSolo) | 单飞 {art+20,wealth+20,rep+15} / 非 {art+10,wealth+10,rep+5} | 2_4 |
| 2_4 | 1979 | 与 Epic 深度合作 | 条件(仅单飞) | A [epicDeep=true] {rep+10,wealth+15} / B [epicDeep=false] {family+5,stress-10} / C 自创厂牌 {art+10,wealth-10,stress+5} | 3_1 |
| 2_5* | 1980 | 格莱美表演 | 选择 | A 炫技 {art+10,rep+5,stress+5} / B 稳妥 {rep+5} / C 拒绝独唱 {rep-3,family+3} | 3_1 |

### 第三章
| ID | 年 | 标题 | 类型 | 选项 / 效果 | 跳转 |
| --- | --- | --- | --- | --- | --- |
| 3_1 | 1982 | 《Thriller》 | 自动(随 isSolo) | 单飞 {art+30,wealth+30,rep+25,stress+10} / 非 {art+10,wealth+10,rep+5} | 3_1b |
| 3_1b | 1983 | Motown 25 月球漫步 | 选择 | A 完美演绎 {art+15,rep+15,stress+5} / B 保守 {rep+5,stress-5} / C 临时改曲避锋芒 {art+5,rep+3} | 3_1c |
| 3_1c | 1983 | 《Thriller》MV | 选择 | A 斥资长版 {art+10,wealth-10,rep+10} / B 传统宣传 {rep+5} / C 恐怖元素过界引争议 {rep+5,stress+5,rep-?} | 3_2 |
| 3_2 | 1984 | 百事广告 | 选择 | A [isPepsiBurned=true] {wealth+20,rep+5} / B [isPepsiBurned=false] {health+10,wealth-20} / C [isPepsiBurned=false] 议价安全拍摄 {wealth+5,health+5} | 3_2b |
| 3_2b* | 1984 | Victory 巡演（兄弟） | 选择 | A 全心 reunion {family+15,wealth+15,stress+10} / B 敷衍 {family+5,wealth+5} / C 借台推个人 {art+10,rep+5,family-5} | 3_3 |
| 3_3 | 1984 | 《Thriller》格莱美之夜 | 自动(随 isSolo) | 单飞 {art+20,rep+20} / 非 {art+8,rep+8} | 3_4 |
| 3_4 | 1985 | 烧伤治疗 | 条件(仅烧伤) | A [painkillerDependent=true] {health+10,stress-10} / B [painkillerDependent=false] {health+5,stress+15} / C 全面康复疗养 {health+15,wealth-10,stress-5} | 3_5 |
| 3_5 | 1985 | We Are The World | 选择 | A [weAreTheWorld=true] 积极义唱 {rep+15,family+5,phil+1} / B 婉拒 {art+5} / C 独自捐巨款 {rep+10,wealth-15,phil+1} | 3_6 |
| 3_6 | 1985 | 收购 ATV | 条件(仅单飞) | A [atvBought=true] money -4750万 {wealth-15,rep+10,mogul+1} / B 不收购 {wealth+5} / C 联合财团分期购 {wealth-5,rep+5,mogul+1} | 4_0 |

### 第四章
| ID | 年 | 标题 | 类型 | 选项 / 效果 | 跳转 |
| --- | --- | --- | --- | --- | --- |
| 4_0 | 1986 | 《Captain EO》 | 选择 | A 接拍 [captainEO=true] {art+10,rep+5} / B 专注音乐 {art+5} / C 要求天价片酬 {wealth+10,rep-3} | 4_1 |
| 4_1 | 1987 | 梦幻庄园 | 选择 | A [neverlandType=public] {family+20,wealth-30} / B [neverlandType=private] {wealth-20,family+5} / C [neverlandType=none] {wealth+10} | 4_2 |
| 4_2 | 1987 | 《Bad》 | 自动(随 isSolo) | 单飞 {art+15,wealth+20,rep+10,stress+15} / 非 {art+10,wealth+15,rep+5,stress+10} | 4_2b |
| 4_2b* | 1988 | 《Moonwalker》/Smooth Criminal | 选择 | A 电影化呈现 [moonwalker=true] {art+12,rep+8,stress+5} / B 仅出单曲 {art+8} / C 与童星搭档引议论 {rep+5,stress+5} | 4_3 |
| 4_3 | 1988 | 自传《月球漫步》 | 自动 | {rep+10,wealth+5} | 4_4 |
| 4_4* | 1989 | 后《Bad》时代 | 选择 | A 商业版图 {wealth+15,rep+5,mogul+1} / B 回归家庭 {family+10,stress-5} / C 先锋作品 {art+12,stress+5} | 5_1 |

### 第五章
| ID | 年 | 标题 | 类型 | 选项 / 效果 | 跳转 |
| --- | --- | --- | --- | --- | --- |
| 5_1 | 1991 | 《Dangerous》 | 自动(随 isSolo) | 单飞 {art+15,wealth+15,rep+5} / 非 {art+8,wealth+10,rep+3} | 5_1b |
| 5_1b | 1991 | 《Black or White》MV | 选择 | A 挑衅意象 {rep+5,stress+5} / B 温和 {rep+5} / C 末段争议动作 {rep-5,stress+5} | 5_2 |
| 5_2 | 1992 | 危险之旅巡演 | 自动 | {wealth+25,stress+20} | 5_2b |
| 5_2b | 1992 | Heal the World 基金会 | 选择 | A [healWorld=true] 全心 {rep+15,family+5,stress+5,phil+1} / B 名义 {rep+5} / C 高调营销慈善 {rep+10,stress+5,phil+1} | 5_2c |
| 5_2c | 1993 | 超级碗中场秀 | 选择 | A 盛大 {art+10,rep+15} / B 低调 {rep+5} / C 邀请童合唱团 {rep+10,family+5} | 5_2d |
| 5_2d* | 1993 | Oprah 访谈 | 选择 | A [oprahOpen=true] 坦诚谈白癜风/童年 {rep+20,stress+10,stress-?} / B 回避敏感 {rep+5,stress+5} / C 拒访保持神秘 [recluse+=] {rep-3,stress-5,recluse+1} | 5_3 |
| 5_3 | 1993 | 1993 年民事指控 | 条件(仅单飞且庄园≠none) | A [settlement1993=true] 达成庭外和解 money -2300万 {rep-20,stress+20} / B [settlement1993=false] 应诉到底 {stress+30} / C [settlement1993=false] 配合调查 {rep-10,stress+25} | 5_4 |
| 5_4 | 1993 | 药物成瘾 | 条件(仅烧伤且依赖) | {rep-15,health-10,stress+20} | 5_5 |
| 5_5 | 1994 | 与 Lisa Marie 结婚 | 选择 | A [marriedLisa=true] {family+15,rep+10} / B [marriedLisa=false] {family-5} / C 高调世纪婚礼营销 {rep+5,wealth-10,stress+5} | 6_1 |

### 第六章
| ID | 年 | 标题 | 类型 | 选项 / 效果 | 跳转 |
| --- | --- | --- | --- | --- | --- |
| 6_1 | 1995 | 《HIStory》 | 自动(随 isSolo) | 单飞 {art+10,wealth+15,rep+5} / 非 {art+6,wealth+10,rep+3} | 6_1b |
| 6_1b | 1995 | 索尼合并 | 条件(仅单飞且 epicDeep) | A [sonyMerge=true] {wealth+50,rep+10,mogul+1} / B [sonyMerge=false] {wealth-10,family+5} / C 反收购更多目录 [mogul+=] {wealth-20,rep+5,mogul+2} | 6_1c |
| 6_1c* | 1995 | 《Scream》与 Janet | 选择 | A 斥巨资拍 [scream=true] {art+12,rep+8,stress+10} / B 简化 {art+6} / C 借势妹妹资源 {family+5,art+8} | 6_1d |
| 6_1d* | 1996 | 《They Don't Care About Us》争议 | 选择 | A 坚持歌词 {rep-5,art+8,stress+5} / B 修改平息 {rep+3} / C 转向《Earth Song》环保 [earthSong=true] {rep+10,phil+1} | 6_2 |
| 6_2 | 1996 | 与黛比·罗结婚 | 选择 | A [marriedDebbie=true] {family+20} / B [marriedDebbie=false] {family-10} / C 代孕规划子女 [surrogacy=true] {family+5,wealth-10} | 6_2b |
| 6_2b | 1997 | 启动《Invincible》 | 条件(仅单飞) | A [invincibleStarted=true] {art+15,stress+30} / B [invincibleStarted=false] {wealth+10,stress-10} / C 半独立制作 {art+8,stress+10} | 6_2c |
| 6_2c | 1997 | 《Blood on the Dance Floor》 | 选择 | A [bloodDance=true] {art+8,wealth+10} / B 搁置 {art+3} / C 混音实验 {art+5,rep+3} | 6_2d |
| 6_2d* | 1997 | 《Ghosts》短片 | 选择(艺术线) | A [ghosts=true] 长片 [artPath+=] {art+10,rep+5,stress+10} / B 放弃 {art+3} | 6_2e |
| 6_2e* | 1999 | 慈善演唱会 | 选择 | A [charity99=true] 全力 [phil+=] {rep+10,family+5,wealth-10} / B 小额参与 {rep+3} / C 联手政要募款 {rep+8,phil+1} | 6_3 |
| 6_3 | 1999 | 与黛比离婚 | 条件(仅已婚黛比) | {family-10} | 6_3b |
| 6_3b | 2001 | 《Invincible》+30 周年 | 选择 | A 盛大纪念 [anniv2001=true] {art+12,rep+10,stress+10} / B 低调 {rep+3} / C 提携后辈 [collab=true] {art+8,family+5} | 6_4 |
| 6_4 | 2002 | 第二次刑事指控 | 条件(仅单飞且庄园≠none) | A [secondVerdict=not_guilty] 应诉 / B [secondVerdict=settled] 达成和解 / C 透明坚持 | 6_4b / 7_1 / 6_4b |
| 6_4b | 2002 | Blanket 出生 | 选择 | A [blanketBorn=true] {family+15,stress+5} / B 暂缓 {family+5} / C 高调展示家庭 [recluse-=] {rep+5,family+10} | 6_4c |
| 6_4c | 2002 | 柏林坠婴 | 选择 | A [babyDangle=true] 致歉 {rep-10,stress+10} / B 沉默 {rep-5,stress+5} / C 反诉媒体 [recluse+=] {rep-3,stress+5,recluse+1} | 6_4d |
| 6_4d | 2003 | Bashir 纪录片 | 选择 | A [bashirDoc=true] 坦然 {rep-5,stress+10} / B 拒拍 [recluse+=] {stress+5,recluse+1} / C 起诉记者 {rep+3,stress+15} | 6_4e |
| 6_4e* | 2003 | 2003 年逮捕程序 | 条件(仅第二次刑事指控) | A 配合保释 {stress+20,rep-5} / B 隐居避世 [recluse+=] {stress-5,recluse+1} / C 公开回应 {rep-3,stress+10} | 6_5 |
| 6_5 | 2005 | 2005 年庭审结果 | 条件(仅第二次刑事指控) | 裁定无罪 {rep+10,stress-20} / 达成和解 {rep-30} | 7_0 |

### 第七章
| ID | 年 | 标题 | 类型 | 选项 / 效果 | 跳转 |
| --- | --- | --- | --- | --- | --- |
| 7_0* | 2008 | 《Thriller 25》/Grammy | 选择(艺术线) | A [thriller25=true] 盛大回归 [artPath+=] {art+10,rep+10} / B 释出混音 {art+5,rep+5} / C 婉拒亮相 [recluse+=] {rep-3,recluse+1} | 7_1 |
| 7_1 | 2006 | 债务危机 | 条件(仅庄园≠none) | A [debtCrisis=true] 转让 {wealth-50,family-15} / B [debtCrisis=false] 保留 {wealth-100,stress+10} / C 引入注资 {wealth-20,stress-5} | 7_2 |
| 7_2 | 2009 | This Is It | 选择(随 isSolo) | 单飞：A 50场 [full] {wealth+100,stress+40} / B 取消 [held=false] {health+20,rep-10} / C 缩减20场 [reduced] {wealth+40,stress+20,health+10}；非单飞：A 20场团体 {wealth+40,stress+20,health+5} / B 取消退休 {health+20,wealth-30} | 7_3 |
| 7_3 | 2009 | 命运裁决 | 自动 | {} | END_JUDGE |

> 注：phil / mogul / recluse / artPath 为隐藏元路线计数器（非负整数），由选项累积；结局判定时读取最高权重者。货币 money 走 Economy 子系统（netWorth/debt）。

### 第八章（续章 · 假设 2009 未离世）
> 仅当 7_2「This Is It」选择 D「续写人生（假设未离世）」进入；时间推进至 2010–2026，置 `survived2009=true`，结局永不归死亡类，按人生状态收束为 `END_TIMELESS_PRESENT`（§7.2 规则 3b）。凡架空处（MJ 存活 / 亲自出演传记片）均有明确标注，其余与史实一致。

| ID | 年 | 标题 | 类型 | 选项 / 效果 | 跳转 |
| --- | --- | --- | --- | --- | --- |
| 8_0 | 2010 | 续章·新的十年 | 选择 | A 驻演 {wealth+30,rep+5} / B 幕后创作 {art+10,stress-5} / C 巡演写歌 {art+8,wealth+15} | 8_1 |
| 8_1 | 2011 | 数字单曲时代 | 选择 | A [digitalSingles] 数字单曲+汇编 {art+12,rep+10} / B 传统专辑 {art+6,rep+4} / C [digitalSingles] 兼顾 {art+8,rep+6,wealth+5} | 8_2 |
| 8_2 | 2014 | 汇编专辑 | 选择 | A 重磅发行 {art+12,rep+12} / B 原样打包 {art+4,rep+4} / C 未公开遗珠 {art+8,rep+8,wealth+5} | 8_3 |
| 8_3 | 2016 | 版权版图兑现 | 选择 | A [sonySold] 套现 Sony/ATV 半数股权 money +7.5亿 {wealth+50} / B 保留部分 {wealth+15,rep+3} | 8_4 |
| 8_4 | 2020 | 遗产与善意 | 选择 | A 扩建基金会 {rep+10,family+3,phil+1} / B 守护家族版权 {family+10,wealth+10} / C 半退半隐 {stress-10,recluse+1} | 8_5 |
| 8_5 | 2026 | 传记电影《Michael》 | 选择 | A [biopic2026] 侄子 Jaafar Jackson 饰演 {rep+12,art+5} / B [biopicMJStar] 亲自出演（架空）{rep+18,art+10,stress+5} / C 低调回避 {rep+3} | 8_6 |
| 8_6 | 2026 | 命运裁决·续 | 结局 | 按 dominantMeta + biopicMJStar 拼接收束文案 | END_TIMELESS_PRESENT |

---

# 七、结局设计

## 7.1 结局列表（18 种，含 1 隐藏终极 + 1 续章结局）
| 结局 | 名称 | 基调 | 简述 |
| --- | --- | --- | --- |
| END_PLAIN | 🌱 平凡人生 | 平静、遗憾 | 留盖瑞，普通一生 |
| END_FAMILY | 👨‍👩‍👧‍👦 家庭幸福 | 温暖、满足 | 不单飞，与兄弟共度 |
| END_RECLUSE | 🏔️ 隐居隐士 | 疏离、释然 | 渐离聚光灯，寻内心平静 |
| END_MOGUL | 💼 商业巨擘 | 冷峻、雄厚 | 音乐帝国与版权版图 |
| END_PHILANTHROPIST | 🕊️ 慈善圣人 | 仁爱、光辉 | 以善意定义传奇 |
| END_TRAGIC | 💔 历史悲剧 | 悲伤、宿命 | 烧伤+依赖+2009 离世 |
| END_ART_PEAK | 🎵 艺术巅峰 | 辉煌、悲壮 | 克服依赖，最高艺术谢幕 |
| END_FINANCIAL | 🏚️ 财务崩溃 | 挫败、警示 | 债务压垮，失去一切 |
| END_CONTROVERSIAL | ⚖️ 争议缠身 | 压抑、疲惫 | 多次庭外和解，声誉承压 |
| END_SURVIVE_DEBT | 💪 生存但负债 | 坚韧、无奈 | 取消巡演保命但负债 |
| END_PERFECT | 🌟 完美传奇 | 圆满、传奇 | 避创伤，健康荣誉安享晚年 |
| END_ETERNAL | 👑 永恒符号 | 崇敬、不朽 | 艺术与声誉登峰，文化图腾 |
| END_TRUE_ETERNAL | ✨ 真·永恒符号 | 不朽、至臻（**隐藏**） | 艺术·声誉·健康·慈善 四方极致收束 + 双加冕，超越时间的终极传奇 |
| END_TIMELESS_PRESENT | ♾️ 在场的不朽 | 在场、超越时间 | 假设 2009 未离世，续写人生；按真实状态收束（见 §7.2 规则 3b） |

## 7.2 结局判定逻辑（优先级规则表）
```
1. END_PLAIN          若 entryId==END_PLAIN（1_5 留盖瑞早退）
2. END_FAMILY         若 isSolo===false
3. END_TRUE_ETERNAL   若 !isPepsiBurned && !debt && art>=88 && rep>=88 && health>=80 && phil>=3 && artPath>=2 && (thriller25 && anniv2001)  【隐藏终极：多方极致收敛 + 双加冕】
3b. 续章收束           若 survived2009===true（7_2 选「续写人生」），则永不归死亡结局，按人生状态收束：ETERNAL > MOGUL > PHILANTHROPIST > RECLUSE > PERFECT > END_TIMELESS_PRESENT（见 §7.1/§8.2）
4. END_RECLUSE        若 recluse 计数最高 且 health>=40
5. END_MOGUL          若 mogul>=2 且 !debt 且 wealth>=60
6. END_PHILANTHROPIST 若 phil>=3 且 !debt
7. END_ETERNAL        若 !isPepsiBurned 且 art>=75 且 rep>=65 且 health>=55 且 (thriller25 || anniv2001)
8. END_PERFECT        若 !isPepsiBurned 且 health>=50 且 rep>=60
9. END_ART_PEAK       若 isPepsiBurned && !dependent && held && health>=40
10. END_TRAGIC        若 isPepsiBurned && dependent && held && health>=35
11. END_SURVIVE_DEBT  若 debt && !held
12. END_FINANCIAL     若 debt
13. END_CONTROVERSIAL 若 (rep<60 && settlement1993) || (media<25 && (settlement1993||secondCharge))
14. 默认                END_TRAGIC
```
> 元路线计数并列时按"艺术>慈善>商业>隐士"次序破平。

## 7.3 结局呈现
名称+图标、100~150 字、最终属性快照（含元路线计数）、重新开始。

---

# 八、数值平衡与结局可达性（v0.5）

## 8.1 delta 预算
小事件 ±5~10；常规 ±10~20；关键分歧 ±20~30；货币走 Economy。**单事件单属性 ≤ ±40**。
压力章节结算 `health -= floor(stress/20)`（RuleEngine）。

## 8.2 十八结局可达性矩阵
| 结局 | 关键门槛 | 玩家路径 | 稀有度（进一步下调·按设计可达性） |
| --- | --- | --- | --- |
| END_PLAIN | 1_5 留盖瑞（硬性分支） | 非巨星线 | common |
| END_FAMILY | isSolo=false | 始终兄弟 | common |
| END_MOGUL | dom==='mogul' & mogul≥2 & !debt & wealth≥60 | ATV+索尼+追加收购 | common |
| END_PHILANTHROPIST | dom==='phil' & phil≥3 & !debt | We Are The World+Heal+1999 慈善 | common |
| END_CONTROVERSIAL | (rep<72 & settlement1993) ∥ (media<40 & (settlement1993∥secondCharge)) | 1993 和解或 2005 指控留污点 | common |
| END_TIMELESS_PRESENT | survived2009 & 非死亡收束 | 7_2 选「续写人生」→ 2010–2026 续章 | common |
| END_INNOVATOR | art≥70 & mogul≥1 & (cp_innovation≥80 ∥ techVenture) | 音乐技术先驱（巨擘之后） | rare |
| END_RECLUSE | dom==='recluse' & health≥35 | 多次拒访/拒拍/隐居 | rare |
| END_RECLUSE_SERENE | dom==='recluse' & health≥50 & 孤独<50 | 平和隐士（隐居之后） | rare |
| END_MENTOR | collab≥1 & family≥40 & art≥50 | 提携后辈（慈善之后） | rare |
| END_ETERNAL | !burned & art≥66 & rep≥56 & health≥46 & (thriller25∥anniv2001) | 拒百事+艺术满投入+控压+加冕标志 | rare |
| END_SURVIVE_DEBT | debt & !held（轨迹优先：烧伤/负债先于成功型结局判定） | 取消巡演保命负债 | rare |
| END_FINANCIAL | debt===true（轨迹优先） | 购庄园+巨和解+成本 | rare |
| END_PERFECT | !burned & !debt & health≥40 & rep≥48（兜底好结局：无主导路线且健康声誉俱佳） | 拒百事+健康声誉稳健（非慈善主导的清白人生） | epic |
| END_STATESMAN | dom==='phil' & phil≥2 & !debt & rep≥58 & family≥45 | 文化大使线 | epic |
| END_ART_PEAK | burned & !dep & held & health≥28（轨迹优先） | 烧伤戒药+满规模 | epic |
| END_TRAGIC | burned & dep & held & health≥28，或烧伤默认收束（轨迹优先） | 历史复刻 / 默认落点 | legendary |
| END_TRUE_ETERNAL | !burned & !debt & art≥85 & rep≥85 & health≥75 & phil≥3 & artPath≥2 & (thriller25&&anniv2001) | 四方极致+双加冕（**隐藏终极**） | legendary（隐藏） |

> 稀有度档位按「设计可达性 / 可达成感」进一步下调（用户反馈：稀有结局不应让玩家觉得遥不可及），并配合图鉴「如何达成」配方。`resolveEnding` 已于 2026-09-05 重构为**轨迹优先**：烧伤 / 负债 轨迹先判定（避免被"成功型结局"抢占而恒为 0），再处理 `!burned&!debt` 的成功/普通结局；各路线型结局要求该路线为**主导**（dom），使"无主导路线且健康声誉俱佳"的局流向 `PERFECT` 兜底。5000 局随机分布：STATESMAN≈2.3% / ART_PEAK≈1.3% / TRAGIC≈2.1% / INNOVATOR≈3.9% / MOGUL≈4.1% / 负债结局≈5%，**15/18 随机出现**（缺 PERFECT=刻意"非慈善清白人生"路径、TIMELESS_PRESENT=续章稀有分支、TRUE_ETERNAL=隐藏终极≈0.04%，均属设计预期）；`check_endings_new.cjs` 定向用例保证 18/18 可达，`check_balance_reach.cjs` 仅作信息型报告、不硬 FAIL。

## 8.3 平衡校验
- **优先级唯一**：1→13 顺序保证不重叠。
- **元路线破平**：艺术>慈善>商业>隐士，避免歧义。
- **可达保障**：Economy 修正后财务/争议/生存可达；元路线由累积计数解锁，非互斥过强。
- **数值 sanity**：非单飞艺术封顶约 60，天然限制艺术/永恒类仅单飞可达；元路线需多事件累积，防止"一键触发"。

---

# 九、UI / UX（四区布局、hint 预览、响应式、无时间压力）
- **四区布局**：状态栏（六属性 + 元路线倾向 + 年份）/ 事件卡（标题 + 正文 + 选项 + 选项后果 hint 预览）/ 时代卡片（章节切片）/ 工具栏（语言 / 分享 / 图鉴入口），暗金复古主题。
- **四图鉴统一**：结局 / 彩蛋 / 趣事 / 成就 共用同一 `.gallery/.g-cell` 卡片组件（锁定态 🔒+未解锁），维护面一致（语录图鉴已移除）。
- **章节主题配色**：基于 `app[data-chapter]`，ch0–ch5 各设主色（盖瑞琥珀 / 单飞靛紫 / 巅峰金 / 风暴青碧 / 谢幕紫 / 续章冰蓝），事件卡顶部主题描边。
- **结局页**：名称 + 图标 + 基调 + 100~150 字独白 + 按基调注入 MJ 语录 + 属性快照 + **传奇海报（Canvas，可保存/复制/分享图片，底部署名 Cr3aM 制作 · MJ Forever）** + 五图鉴入口 + 人生回顾分组（专项造诣 / 关键抉择 / 人生手记 / 假如…(想象) / 时代回响 / 时代切片）。
- **Toast 串行队列**：成就 / 彩蛋 / 趣事 / 语录 解锁弹窗排队展示，避免重叠。
- **响应式**：多断点（≤600 / ≤640 / ≥900 / ≥1080），窄屏重排（padding/字号缩小、`.btn-row` 纵向、`.bars`/`.snapshot`/图鉴网格 2 列、菜单 2 列、`.toolbar` 换行、`.subdim-name` 限宽）；`prefers-reduced-motion` 尊重；模态 `max-height`+滚动。
- **元路线反馈**：属性面板下方小型"人生轨迹"标签暗示（如"艺术家倾向↑"）。

---

## 十八、近期 UI/UX 优化方案（2026-09-04 规划）
> 目标：在已落地内容基础上，打磨"重复游玩体验"与"信息呈现清晰度"，并为"人生档案库"等新功能定方案。凡涉及实现的条目均给出【已落地 / 规划】状态。

### 18.1 GDD 对齐游戏现状（本次）
- §〇 实现状态总览更新：成就 56 / 变体 65 / EN 全量 318 字段 / 五图鉴统一 / 章节主题配色 / 响应式多断点；§8.2 由"十四结局矩阵"扩为"十八结局可达性矩阵"（补 STATESMAN/INNOVATOR/MENTOR/RECLUSE_SERENE）。【已落地（文档侧）】

### 18.2 结局页 UI 与"语录下方"排版
- **问题**：结局页把快照 / 海报 / 5 个图鉴按钮 / 6 个回顾面板竖向堆叠，"语录下方"观感杂乱。
- **方案**：① 把 6 个回顾面板（专项造诣 / 关键抉择 / 人生手记 / 假如…(想象) / 时代回响 / 时代切片）包进 `.review-grid`（桌面 2 列、移动 1 列）做视觉分组；② 属性快照包进"人生快照"卡片，与语录/独白明确分区；③ 海报缩略图与按钮归一组。
- **状态**：① 已落地（`.review-grid` 2 列分组）；②③ 建议下一轮细化。

### 18.3 彩蛋 / 趣事图鉴减列（长文自适应）
- **方案**：文案较长的彩蛋/趣事图鉴，桌面 2 列、移动端 1 列，并放宽 `.g-desc` 高度，避免窄格挤行。
- **状态**：【已落地】`egg-gallery/trivia-gallery` 减列 + 放长描述。
- **语录图鉴**：用户于 2026-09-04 要求移除（MJ 名言/歌词准确性存疑、且将歌词当"名言"归类不当），已从 engine / ui / i18n / events / test 全量删除；若未来重做，建议仅保留 6 条逐字正确的歌曲歌词并明确标注「歌词」与出处。

### 18.4 主菜单英文居中
- **现状**：`.intro` 已 `text-align:center`，英文副标题 `Moonwalk: The Legend's Choice` 本就居中于中文标题之下，无需改动。
- **建议**：保持；如需强化层级，可给 `.intro .sub` 加 `letter-spacing` 与中文标题形成区分。

### 18.5 移动端填满核验
- **方案**：① 核验 `.app` 在 320/375 宽度是否 100% 铺满、无横向滚动；② 模态窄屏 `width:auto` + 左右留白、内部 `max-height+overflow` 滚动；③ 图鉴网格窄屏 1–2 列；④ 海报 canvas 窄屏等比缩放。
- **状态**：【规划】结构与断点已就位（check_responsive 守卫通过），真机/浏览器多宽度（320/375/768/1280）人工核验为必要收尾（见 §17.10）。

### 18.6 随机事件 / 变体弹出频率与权重平衡 ★核心
- **现状（calibration 数据，check_balance_reach 5000 局）**：变体触发率 7.24%~92.5% 差异巨大；大量中期变体卡在 66.64%，因 `pickVariant` 用 `break` 取「迭代序首个通过 `weight` 的变体」→ 同窗口变体互相挤占，权重不线性映射为每局触发率；每主线节点至多 1 个变体、每局每变体至多 1 次。
- **问题**：变体频繁弹出打断主线叙事，且"是否弹出"感觉随机不可控，削弱重复游玩的"核心故事连贯感"。
- **方案（平衡旋钮）**：
  1. **加权随机而非首个命中**：把 `break` 改为"收集本节点所有 `window` 命中且 `cond` 通过的候选，按 `weight` 加权随机选 1 个"，使 `weight` 真正决定触发率（校准可直接用 `weight` 调频）。
  2. **每章变体上限 / 冷却**：每章至多 N 个变体（如 1–2），或两次变体间至少间隔 K 个主线节点，避免聚簇。
  3. **条件门控**：给更多变体加 `cond`（如 `art>=80` / `phil>=2`），让"弹出"与玩家路线强相关，而非纯概率噪声。
  4. **纯净模式开关**（见 §17.5）：剧情党可一键关闭变体，保证"同一核心叙事"重复游玩。
  5. **调权**：依据 calibration 报告，对 66.64% 聚簇的中期变体适当下调 `weight`，对 7.24% 等稀有变体（如 `V_INVINCIBLE_CLASH`）按需上调或加门控。
- **状态**：【已落地（2026-09-04）】`pickVariant` 改为「每候选独立按 `weight` 掷骰 + 命中者中加权随机选 1」，消除旧版 `break` 首个命中导致的迭代序挤占；新增每章上限（`VARIANT_CAP_PER_CHAPTER=6`）+ 冷却（`VARIANT_COOLDOWN_NODES=2`）。`check_balance_reach` 由 FAIL→PASS，触发率峰值由旧版 92.5%/100% 降至约 73%，宽窗口变体无 0 触发（单一年份窗口的 BIO 彩蛋变体偶发 0 属预期稀有，非 FAIL）。调权（下调 66.64% 聚簇中期变体）留待下轮依校准报告进行。

### 18.7 人生档案库（Life Archive）
- **需求**：主页记录玩家玩过的存档，供回顾。
- **数据模型**（localStorage `mj_archives`，数组，按时间倒序）：
  `{ ts, endingId, endingName, attrs:{6 属性}, netWorth, legendScore, legendGrade, dominantMeta, achCount, variants, keyChoices, posterDataURL(缩略) }`
- **UI**：主页 `.menu-grid` 新增「🗂️ 人生档案库」按钮 → 模态列出历史局（卡片：结局图标+名称+日期+传奇评分+缩略海报），点击查看该局回顾并可"重看海报/分享"。
- **落点**：与现有 `saveSystem`（单一当前存档）解耦——档案库是"历史只读快照"，当前进行中的存档仍走 `saveSystem`。
- **状态**：【已落地（2026-09-04）】`saveSystem` 新增 `mj_archives`（数组、按 `ts` 倒序、上限 100）；`ui.showEnding` 终局一次性写入快照（存完整 `state.serialize()` 以便即时重绘海报，带 `state._archived` 防切语言重渲染重复写入）。主菜单 `.menu-grid` 新增「🗂️ 人生档案库」入口 → 模态 `.gallery/.g-cell` 卡片列表（结局图标/名称/日期/主导路线/传奇评分/成就数）→ 点击即时 `createPoster` 重绘海报 `openPosterModal` 回看（零额外存储，与当前进行中 `saveSystem` 存档解耦）。含「清空档案」与空状态提示，EN 全量。

### 18.8 结尾海报增强 + 底部 credit
- **已落地**：海报底部新增署名「Cr3aM 制作 · MJ Forever」（canvas `H-20`）。
- **建议增强**：① 生卒年份跨度（`1958 — {endYear}` 已在）；② "人生关键词"标签云（由主导元路线 + 最高属性生成）；③ 一句结局基调 tagline 已存在；④ 可加"本局最关键的 1–2 个抉择"回看；⑤ 海报右下角小号"MJ Forever"水印。
- **状态**：【已落地（2026-09-04）】credit 早已落地；新增「人生关键词标签云」（主导元路线 + 属性降序前 2，canvas 圆角金边 pill）与「本局最关键 1–2 个抉择回看」（取自 `state.history` 中 `key` 标记节点，首/尾各一），置于成就阵与结局独白之间。EN 全量。

### 18.9 下一步工作（优先级）
1. **P0 变体平衡（§18.6）**：实现加权随机 + 每章上限/冷却，重跑 `check_balance_reach` 校准，目标触发率分布更平滑、减少"随机打断感"。
2. **P0 移动端真机核验（§18.5）**：320/375/768/1280 多宽度人工走查 + 截图。
3. **P1 人生档案库（§18.7）**：localStorage 历史快照 + 主页入口 + 回看。
4. **P1 结局页细化（§18.2 ②③）**：快照卡片化、海报/按钮分组。
5. **P2 海报增强（§18.8）**：关键词云 / 关键抉择回看。
6. **P2 调权**：依据 calibration 报告微调中期变体 `weight`。

### 18.10 结局稀有度进一步下调 + 英文补全（2026-09-05）
- **稀有度进一步下调（已落地）**：用户反馈"大部分结局可达性太低、不应让玩家觉得遥不可及"。在上一轮按随机可达率分档的基础上再次整体下调——档位改为 **common 常规走向（6）/ rare 需特定路线投入（7）/ epic 高数值组合（3）/ legendary 仅宿命或隐藏终极（2：END_TRAGIC 与隐藏终极 END_TRUE_ETERNAL）**；`config.endingRarity` 已同步（§8.2 矩阵按档位重排）。设计取向从"纯随机命中率"转为"设计可达性 / 可达成感"，配合图鉴「如何达成」配方让玩家明确 pursuit 路径。
- **结局英文补全（已落地）**：`i18n.js` 结局 `name/tone/summary/monologue` EN 键此前已存在，但 **`hint` 的 EN 键完全缺失**，且结局详情弹窗 `endingDetailModal` 的 `tone` 直接用中文 `e.tone` 未走 `T()`——故英文模式下「如何达成」与「基调」仍回退中文。本次补全 18 个 `ending.END_*.hint` EN 键，并将弹窗 `tone` 改为 `T('ending.'+key+'.tone', ...)`；已用 Node 校验 EN 模式解析为英文、无中文回退。结局页（`showEnding`）与图鉴卡片本就用 `T()`，无需改动。
- **平衡测试重跑确认无抢占（已落地）**：`npm test` 全绿（`check_endings_new` 定向用例保证 18/18 可达、`check_balance_reach` 概率校准 PASS）；随机分布本局 17/18（仅缺隐藏终极 `TRUE_ETERNAL`，其随机命中率约 0.04%，单次波动正常，定向用例覆盖）。各结局计数分布与改前一致，说明本次仅下调标签、未动引擎；优先级规则表确保无结局因高优先级结局抢占而恒为 0（详见 §8.3）。
- **状态**：【已落地（2026-09-05）】lints 0；`npm test` 全绿（FAIL:0）。

### 18.11 结局真实可达性提升（轨迹优先 + dom 门控，2026-09-05）
- 用户要求"随机玩也更容易撞见特殊结局"——真正放宽 `engine.resolveEnding` 阈值，而非仅下调稀有度标签。
- 重构为**轨迹优先**：烧伤 / 负债 轨迹先于"成功型结局"判定，避免被 MOGUL/PHIL/ETERNAL 等抢占而恒为 0（此前 ART_PEAK/TRAGIC 仅≈0.04%）。各路线型结局要求该路线为**主导（dom）**，使无主导路线且健康声誉俱佳的局流向 `PERFECT` 兜底。
- 门槛放宽：ETERNAL(art75→66/rep65→56/health55→46)、STATESMAN(rep70→58/fam55→45)、MENTOR(collab2→1/fam50→40/art60→50)、ART_PEAK/TRAGIC(health→28)、RECLUSE_SERENE(health55→50)、INNOVATOR(art80→70)；并修复 PERFECT 漏 `!debt`、RECLUSE_SERENE 曾宽于 RECLUSE、PHIL 降 phil 吞 STATESMAN 等回归（均经 `check_endings_new` 18 定向用例验证）。
- 效果（5000 局固定种子）：15/18 随机出现；STATESMAN≈2.3% / ART_PEAK≈1.3% / TRAGIC≈2.1% / INNOVATOR≈3.9% / MOGUL≈4.1% / 负债结局≈5%（上轮 PERFECT/STATESMAN/ART_PEAK/TRAGIC≈0.04%）。`PERFECT` 在均匀随机为 0 属设计内禀：随机局多堆叠慈善→归 STATESMAN；其图鉴 hint 即"不走慈善、健康声誉俱佳"的刻意玩法，按配方可稳定达成。
- 状态：【已落地（2026-09-05）】lints 0；`npm test` 全绿（FAIL:0）；§8.2 矩阵门槛与注释已同步。

### 18.12 成就图鉴按「实际可达性」排序（2026-09-05）
- 用户要求成就图鉴不再按手写稀有度档位排序，而按**真实可达性**排序。稀有度标签与实际触发率严重不符（例：`ACH_BROTHERLY` 标 `common` 却 0% 触发；`ACH_SMOOTH` 标 `rare` 却 99.7%）。
- 实现：新增 `test/compute_ach_reach.cjs`（复用 smoke 跑局循环 + localStorage 垫片，`saveSystem.save` 置空加速），均匀随机跑 **5000 局**，对终局状态逐成就调用 `check(state,{ending})`，统计命中率。结果烘焙进 `config.achievementReach`（56 项全覆盖，与 `config.achievements` id 一一对齐）。
- `ui.js`：`achievementsPanel`（成就图鉴）与结局海报 `thisRun`（成就图标）均改为按 `achievementReach` 降序排序（实际可达性高的在前 = 易得者先；同可达率再按 `rarityRank` 兜底）。分享文案仅用计数，不受影响。
- 实测谱（降序摘录）：SMOOTH 99.7% / PACIFIST 85.9% / FAMILYMAN 72.5% / TOUR 63.3% / PHIL 61.3% / … / 末端 0% 组为跨周目或刻意玩法成就（TRUE_ETERNAL / GRAMMY_SWEEP / ALL_ENDINGS / EGG_HUNTER / CHARITY_CONCERT / LONELY_KING / BROTHERLY）。
- 状态：【已落地（2026-09-05）】lints 0；`npm test` / `test:full` 全绿；dist 已重建。

### 18.13 成就可达性核查 + 章节密度（2026-09-05）
- 成就可达性核查（test/check_achievable.cjs + compute_ach_reach.cjs）：发现并修复 2 个**真·不可达成 bug**：
  - `ACH_BROTHERLY`：原 `relations.brothers >= 20` 不可达（全事件仅 `1_5` 一处），先降阈值至 `>= 10`；随后补「Ch0 童年四事件（0_0 钢铁城的家 / 0_1 第一次独唱 / 0_2 阿波罗剧院之夜 / 0_3 Motown 引荐）」+「6_3a_r 三十周年兄弟同台（2001 麦迪逊广场花园史实）」，将阈值定为 `>= 20`——需真正经营手足情方可达成（手足路线实测 brothers=56 触发；自私路线 brothers=-20 不触发）。`brothers` 关系现由 Ch0 四事件 + 1_5 + 6_3a_r 多处驱动。
  - `ACH_LONELY_KING`：原 `s.flags.loneliness`，但孤独是**属性**（`s.attributes.loneliness`，同文件 `ACH_LONELY` 即如此）。已改为 `s.attributes.loneliness`，高隐士+低家庭/媒体+高声誉路线可达成。
- 其余 0% 项均非 bug：`ACH_TRUE_ETERNAL`/`ACH_BIOPIC` 等需特定结局路线（TRUE_ETERNAL 已由 stratPinnacle 验证可达）；`ACH_GRAMMY_SWEEP` 经数学验证（六专辑满精工+高 momentum 下 q 远超 60 阈值）属「刻意全音乐高精工路线可达」；`ACH_ALL_ENDINGS`/`ACH_EGG_HUNTER`/`ACH_SMOOTH` 为跨周目设计。
- 章节事件密度（test/analyze_chapters.cjs，主线+变体）：Ch0 童年原 6+0（1958–1969 整段最薄）；**已于本次补齐 4 个主线童年事件（0_0/0_1/0_2/0_3，年份 1961/1963/1967/1968，填补 1958–1964 空白并补足 Apollo 夺冠、Motown 引荐等史实）**，现 Ch0 主线 10。Ch1 12+5、Ch2 17+15、Ch3 22+30、Ch4 13+11、Ch5 15+4 未动。Ch5 续写传奇变体偏少（4）仍可补充。
- 英文翻译：i18n 覆盖校验 FAIL:0（306 字段 0 缺失；EN 428 条 0 空值/0 漏译/0 残留中文；UI 字面量 95 键 EN 全有）。CSS 已为 EN 适配（`.btn`/`option` 缩小字号字距、`word-break:break-word`、`white-space:pre-line`、模态/图鉴/日记容器 `overflow:auto`），长英文换行而非挤压，结构健全。
- **事件编写约定（易踩坑，2026-09-05 实测）**：关系好感 `rel` 必须**嵌套在 `effects` 内部**（`effects: { ..., rel: { brothers: 8 } }`）。引擎 `choose` 只调用 `applyEffects(opt.effects)`（engine.js 356 行），而 `applyEffects` 仅识别 `eff.rel` 分支（43–47 行 `state.changeRel`）。若把 `rel` 写成选项级同级键（`effects:{...}, rel:{...}`），`rel` 将被**静默忽略、永不生效**（本次新增事件即踩此坑，已修正）。新增/修改事件写 `rel` 时务必内嵌于 `effects`。

# 十、美术与听觉（同前：暗金复古、符号化、原创/公共领域 BGM）

---

# 十一、技术架构
详见 `架构设计.md`：数据驱动分层、JSON 事件 schema（含 `variant`/`weight` 支持变体事件、`metaPath` 标记）、OutcomeResolver 规则表、Economy 双轨数值、RuleEngine、SaveSystem、I18n、Vitest、Vite 单文件构建。

---

# 十二、新手引导 / 十四、数据埋点
（规划同前；埋点新增：变体事件触发率、元路线分布、18 结局分布、三选占比。）

# 十三、本地化（i18n · 英文优先）

## 13.1 目标
- 支持多语言；首期实现 **英文 EN**，架构预留更多语种扩展位。玩家可在主菜单切换，偏好写入 `localStorage`。
- 所有面向玩家的文本（事件正文/选项/hint/尾声、UI 文案、开场、结局名与独白、分享文案、图鉴/成就名与描述）均应可翻译，**不含硬编码中文字面量**。

## 13.2 架构方案（贴合现有数据驱动骨架）
- 新增 `MJ.i18n`：`MJ.i18n.dict = { zh: {...}, en: {...} }`；`MJ.i18n.lang` 由 `localStorage.mj_lang` 读取，默认 `zh`。
- 统一入口 `MJ.t(key, vars)`：查当前语种字典；缺失时回退 `zh` 再回退 `key` 本身（避免空串）。
- **字符串抽取**：将 `events.js` 的 `narr/text/label/hint/epilogue`、`ui.js` 文案、`index.html` 引导与按钮全部改为 `MJ.t('ev.8_3.title')` 形式；字典按命名空间分层（`ev.*` / `ui.*` / `intro.*` / `ending.*` / `ach.*`）。
- 结局名/独白、成就名与描述同样走字典（当前 `config.endings[].name/monologue`、`config.achievements[].name/desc` 改为取 `MJ.t`）。

## 13.3 英文优先的实施分期
- **P1（骨架 + 核心 EN）**：落地 `MJ.i18n` / `MJ.t` + 语言切换 UI + 核心文案 EN（开场、结局列表/独白、主菜单、分享、图鉴/成就壳）。ZH 字典保持现状（即当前中文）。
- **P2（事件 EN 全集）**：`events.js` 全部 `narr/text/label/hint/epilogue` 抽取并译 EN（约 90+ 主线节点 + 34 变体）。
- **P3（打磨）**：数字/货币格式化（`formatMoney` 按语种切换 ¥/万 ↔ $/M）、字体字距回退（英文更紧凑）、海报文案双语可选。

## 13.4 验收
- 切 EN 后全流程无中文残留（专有名词 Michael Jackson / Sony/ATV / Thriller 等保留原名）；
- `node --check` 与冒烟测试仍全绿（i18n 仅改文案，不影响规则/数值/结局判定）。

---

# 十五、设计原则与约束
选择有意义、历史尊重、情感真实、重玩性、可访问性；内容边界（不渲染创伤细节、版权红线）。

## 15.1 内容中性化规范（敏感/法律事件）
对真实人物的争议与法律事件，采用**中性、程序化、只陈述可考证事实**的表述，避免预设有罪/无罪的定性语言：
- **术语表**：以「民事指控 / 刑事指控 / 逮捕程序 / 庭审 / 庭外和解 / 裁定无罪」等程序性名词替代「性侵指控」「喊冤」「崩塌」等带倾向词汇。
- **只写事实节点**：年份、提起方、法律动作、结果（如"1994 年约 2300 万达成庭外和解""2005 年 6/13 庭审结束，全部罪名不成立"），不描写行为细节。
- **判断交还玩家**：事件走向（应诉 / 和解 / 透明坚持）由玩家选择驱动，游戏不为真实人物定罪；flag（settlement1993 / secondVerdict）仅记录玩家在虚构平行历史中的取舍。
- **结局中立**：END_CONTROVERSIAL 等只描述"玩家路径导致的声誉后果"，不评价真实人物。
- 适用范围：4.5 生平年表、6.3 事件链、6.4 节点目录（5_3、6_4、6_4e、6_5 等）、第七章结局。

---

# 十六、已知问题与设计修正
1. 财富 clamp bug → Economy（netWorth/debt）。
2. 属性联动缺失 → RuleEngine。
3. 存档未实现 → SaveSystem。
4. flag 不一致 → flags.json + Validator。
5. **v0.5 新增**：原 8 结局偏窄 → 扩至 12（v0.5）→ 现 14（含 1 隐藏终极 + 1 续章，v0.7），并引入元路线/变体事件，判定优先级无冲突（已由 7.2 规则表约束）。

### 16.1 构建 / 运行时踩坑记录（2026-09-04 修复归档）
> 下列为上线过程中真实踩过的坑与修复，供后续维护避坑。

1. **单文件构建黑屏（致命 · 已修复）**：`build_singlefile.cjs` 用 `html.replace(initRe, combined)` 把合并脚本当**替换字符串**注入，而 `combined` 内含 `js/ui.js` 的 `return sign + '$' + ...` 的 `'$'`，被 JS `String.replace` 解释成特殊模式 **`$'`（匹配项之后的文本 = 原 HTML 尾部的 `</body></html>`）**，从而把 `formatMoney` 那一行截断、`'</body></html>'` 被注入脚本，整段 `<script>` SyntaxError → `MJ` 未定义 → 单文件黑屏（模块化版正常，故曾误判为"环境性"）。**修复**：init 注入与 CSS 内联均改用函数式替换 `html.replace(re, function(){ return str; })`，返回值原样插入、不做 `$` 解释；并新增 `test/dist_check.cjs`（对真实 dist 做 `node --check` + HTML 隐患扫描）与 `test/dist_run.cjs`（用真实 dist 在 vm 执行验证 `MJ` 定义/初始化/完整游玩）作为回归守护。

2. **成就/彩蛋弹窗"一次性弹出两个"（已修复）**：`showEvent` 与 `showEnding` 各调一次 `achievementSystem.evaluate`，`eggSystem.onEnding` 又调一次（结果丢弃）；当一次判定同时解锁多个成就/彩蛋时，多个 `.ach-toast`/`.egg-toast` 被同时 `appendChild` 到 `body` 同一固定位置 **重叠**，看起来像"一次性弹出两个"。**修复**：UI 增加 toast 队列（`_enqueueToast`/`_pumpToast`），多个解锁串行展示（每个约 3s），不再重叠；并移除 `onEnding` 中冗余的 `achievementSystem.evaluate` 调用（成就已在 `showEnding` 统一评估并弹窗）。方案见 §17.12。

3. **CSS 内联 `$` 风险（已预防）**：CSS 内联替换同样改用函数式，避免 `style.css` 内 `$$`/`$&`/`$'`/`$\`` 被 `String.replace` 误解释。

4. **静默黑屏 → 错误浮层**：`index.html` 与 `build_singlefile.cjs` 的初始化脚本加 `try{ MJ.ui.init() }catch(e){ 在 #app 渲染错误堆栈 }` + `window.addEventListener('error', ...)`，任何异常都**显式展示**而非黑屏——本次黑屏即由该浮层暴露 `MJ is not defined` 而定位。

> 经验：**凡用 `String.prototype.replace(re, replacementString)` 且 replacement 来自代码/文本常量时，若内容可能含 `$&`/`$'`/`$\``/`$$`/`$n`，一律改用函数式替换 `replace(re, () => str)`**，否则会静默注入文档片段、造成诡异截断。单文件打包器尤甚。

---

# 十七、后续扩展
> 实现状态（截至代码侧多轮迭代）：成就（✓ 56 项）、关键选择回顾（✓）、社交分享（✓ 传奇海报：Canvas 图片 + 保存/复制/分享图片 + 引导页文字分享）、被搁置彩蛋 chinaVisit 访华（✓ 隐藏变体）、变体事件池（✓ 65 个，含 稀有门控隐藏/条件变体）、元路线倾向反馈（✓ §9）、生涯数据深度（✓ 节点/变体/关键抉择计数）、环境音（✓ §10 WebAudio 开关）。**功能性扩展大多已落地；EN 全量已落地（见 §13、i18n_coverage 测试），仍有大量「体验深化（代入感与故事性）」候选，见 §17.1。**

- 多语言 i18n（规划中 · 英文优先，设计见 §13）
- 成就（慈善家/巡演王/法律斗士/隐士，✓ 已扩至 56 项，含稀有度排序与可重置图鉴）
- 关键选择回顾（✓）
- 社交分享（✓ 已升级为「传奇海报」：Canvas 生成可保存 PNG，支持保存/复制文案/移动端分享图片；引导页保留文字分享；海报现含**结局独白文案 + 本局点亮成就（按条件判定，非历史累计解锁）+ 结束年份（2009/2026）+ 净资产**，不再展示历史已解锁成就总数）
- 被搁置彩蛋（chinaVisit 访华，✓ 已实现为隐藏变体）
- 变体事件池（✓ 已达 65 个，含 5 个稀有门控隐藏/条件变体）

### 17.1 体验深化路线（代入感与故事性）★已落地（2026-09-04，M1–M8 全部实现）
> 目标：在已搭好的"数据驱动 + 元路线 + 变体 + 18 结局（含 1 隐藏终极 + 1 续章）+ 海报"骨架上，补上**情感与叙事血肉**，强化"蝴蝶效应"（§2.2）与"历史尊重/情感真实"（§15）。按性价比分三档；每个模块若实现，建议在 GDD 中新增对应小节（如 §5.8/§5.9/§6.2 强化）。

**高优先（强代入感 + 中低实现成本）**
- **M1 关系/羁绊系统（建议 §5.8）**：当前仅 `family` 属性 + 婚育 flag。新增具名 NPC 好感（昆西·琼斯、兄长、Lisa/Debbie、子女 Prince/Paris/Blanket、歌迷），好感随事件累积，解锁专属对话与结局分支（如"与昆西决裂→后期艺术受限""父女和解→晚年家庭+温暖"）。最易放大情感投入。**【✅ 已实现】** 具名 6 NPC 好感（兄弟/昆西/Lisa/黛比/孩子/歌迷），结局页羁绊面板 + 成就「兄弟同心 / 万众倾心」。
- **M2 内心独白 / 手记系统（建议 §5.9）**：在章节节点按"元路线 + flag"程序化拼接 MJ 第一人称手记（复用结局 `monologue` 机制），结局页汇总为可收藏"人生手记"。直接提升故事性与代入感。**【✅ 已实现】** 按章节 + 元路线生成 MJ 第一人称手记，结局页"人生手记"汇总。
- **M3 章节过场与时代切片（强化 §6.2）**：年份推进时插入"时代卡片"（MTV 诞生、CD 盛世、互联网兴起、9·11 前后氛围），把选择锚定到真实时空，增强时代沉浸。**【✅ 已实现】** 按年份切 5 章，跨章触发"时代卡片"过场（含手记 + 回响）+ 章节主题色。
- **M4 命运回响 / 因果回调（强化 §2.2 蝴蝶效应）**：后续事件显式引用早年选择（"因 1979 年你拒拍《Thriller》长版，如今……"），已通过 `narr` 分支部分实现，建议系统化、做成可见的"因果链"提示。**【✅ 已实现】** 早前选择（单飞 / 烧伤 / 药物依赖 / 婚姻 / 孩子 / 慈善 / 退隐）在章节过场"命运回响"中回响，结局页汇总。

**中优先（系统厚度）**
- **M5 舆论/媒体轴（细化 §5.2）**：在 `声誉` 之外增"媒体关系"维，驱动谣言/澄清/反转事件链（V_RUMOR 升级为持续系统）。
- **M6 心理轴（孤独/自我）**：独立于 `压力`，由 `recluse` + 低 `family` 累积，触发童年闪回（盖瑞/父亲），影响隐士/悲剧基调与回忆事件。**【✅ 已实现】** 新增 `孤独` 维度（recluse + 低家庭 + 低媒体累积），≥35 触发 V_FLASHBACK 童年闪回变体。
- **M7 传奇评分 / 遗产评级（强化 §7.3）**：结局页给出综合"传奇指数"与评级（S/A/B…），海报展示，给重玩明确目标。**【✅ 已实现】** 终局 S/A/B/C/D 传奇评分，结局页 / 海报 / 分享文案展示。
- **M8 章节主题色与音景分层（强化 §10）**：按章切换配色（童年暖→巅峰金→坠落冷→告别幽蓝）与氛围音动机；`压力`升高时音景收紧。**【✅ 已实现（主题色）】** 每段落主色切换（`#app[data-chapter]`）；音景增益分层为后续可选增强。

**长线 / 可选**
- **M9 真·永恒隐藏结局（扩展 §7.1）**：需 艺术+声誉+健康+慈善 多方极致收敛 + 关键成就，作为终极目标。【✅ 已实现】 隐藏结局 `END_TRUE_ETERNAL`（§7.1/§7.2/§8.2），图鉴默认隐藏、达成后解锁，结局页专属金色辉光 +「真·永恒」成就（reachable：贪心巅峰策略 500 局命中 333 次）。
- **续章·假设 MJ 未离世（2010–2026）**：用户本回合新增需求（非 M10–M12）。【✅ 已实现】 7_2 新增「续写人生」分支进入第六章，事件 8_0–8_6 覆盖 This Is It 驻演、Michael Prince 数字单曲计划、2016 索尼收购 Sony/ATV 半数股权（约 7.5 亿美元，现实参照）、2026 传记片《Michael》（侄子 Jaafar Jackson 主演）；8_5 传记片事件现提供玩家选择：真实历史线由侄子 Jaafar Jackson 饰演（成就 `ACH_BIOPIC`），或架空续章线由 MJ 亲自出演银幕上的自己（成就 `ACH_BIOPIC_SELF`，结局页专属收束文案）；结局 `END_TIMELESS_PRESENT` 等由 `survived2009` 标志驱动，永不归死亡结局（§7.2 规则 3b）。
- **多节点「架空历史」选择 + 生平补全（本回合）**：明确标注的架空入口现分布于多个关键节点——`3_2`（1984 百事）新增「若那簇火没烧到你（架空想象）」改写烧伤伏笔；`7_2`（2009 This Is It）保留「续写人生（假设未离世）」宏观架空入口（→ 续章 8_0–8_6）。同时补全主要生涯节点（均按史实接入主线 `next` 链）：`4_2a`《Bad》世界巡演（1988，单飞后首次全球 solo 远征）、`6_1e` HIStory 世界巡演（1996–97，当时 solo 艺人最大规模巡演）、`6_3a` 9·11 与三十周年 /《Number Ones》（2001，赴废墟旁义演）。史实核对：ATV 1985 以约 4750 万美元购入（事件 3_6）、索尼 2016 以约 7.5 亿美元收购半数 Sony/ATV（事件 8_3）、2005 庭审无罪（事件 6_5）均属实。
> **M10 / M11 / M12 / g6（UI 可视化）已列入「无限期延迟」（2026-09-04 用户决定）**：以下功能暂不实现，亦不作为后续排期项，除非后续明确重启。
- ~~M10 多周目传承（NG+）~~：解锁"导演评论/幕后花絮"模式，或"传奇等级"解锁限定变体，强化重玩性。
- ~~M11 成就叙事化~~：部分成就解锁专属幕后片段（如"月球漫步诞生"花絮），让成就成为故事节拍。
- ~~M12 关键抉择回放时间轴~~：结局页"人生回放"带年份标记与"假如当初…"提示，呼应 §5.7 重玩性。
- ~~g6 UI 可视化增强~~（2026-09-04 用户决定·无限期延迟）：属性雷达图 / 人生轨迹时间轴 / M1 关系星座图等可视化增强（§17.1 原"UI/可视化增强"长线候选）。当前游戏仅以属性状态条 + Canvas 结局海报 + 时代卡片呈现，暂不实现可视化增强。

### 17.2 续章深度拓展（候选节点 · 假设 2009 未离世）
> 现状：第六章（2010–2026）仅 `8_0`–`8_6` 共 7 节点，撑起 16 年，密度远低于主线各章（每章 10–25 节点）。这是当前 **最值得拓展** 的章节——既有大量真实"遗产时代"里程碑可作史实锚点，又能显著拉长「在场的不朽」线、丰富 `END_TIMELESS_PRESENT` 的收束维度。
> 设计约束（§15.1）：凡架空处（MJ 亲自出演 / 存活）明确标注；真实争议事件以中性、程序化表述，玩家选择驱动应对，游戏不为真实人物定性。

| 候选 ID | 年 | 标题 | 史实锚点 | 玩法 / 维度 |
| --- | --- | --- | --- | --- |
| 8_1b | 2014 | 全息归来 | Billboard 颁奖礼 «Slave to the Rhythm» 虚拟演出（2014-05） | 艺术+声誉+科技奇观；可联动 artPath |
| 8_2b | 2014 | 遗作《Xscape》 | 遗作专辑发行（2014） | 与 8_2「汇编」形成"生前规划 vs 身后遗珠"对照 |
| 8_3b | 2013–2017 | 遗产税争议 | 遗产管理委员会 vs IRS 估值诉讼（2013 起诉，2017 判决） | 法律线延续；中性表述，影响财富/媒体 |
| 8_4b | 2022 | 《MJ the Musical》 | 百老汇音乐剧首演（2022-01） | legacy 里程碑；声誉+艺术，可触发专属成就 |
| 8_4c | 2022–2023 | 《Thriller 40》周年 | 40 周年企划（2022 宣布，2023 专辑） | 周年怀旧；声誉+家庭温情 |
| 8_5b | 2019 | 舆论风波 | 纪录片引发的公共讨论（2019） | 争议轴延续：沉默 / 声明 / 转做慈善 三选，影响 媒体/孤独/争议 |
| 8_7 | 2026+ | 留给后人的话 | 收束前的"遗产寄语" | 自动节点，依 `dominantMeta` 生成个性化遗言，再进入 8_6 |

- **续章专属变体池**：新增 `V_POST_*` 变体（窗口 `[2010,2026]`），如「年轻一代翻唱致敬」「AI/全息巡演争议」「家族内部版权争执」，丰富续章重玩性。
- 接入后与现有 `survived2009` 路由、元路线、结局判定完全兼容（仅延长链路、增加分支）。
> **状态：✅ 已落地（续章深度拓展回合）**。候选节点全部实现并串入 `survived2009` 续章链路；续章密度由原 7 节点增至 14 节点；`media`(媒体)/`loneliness`(孤独) 已作为真实属性接入（含成就 `ACH_MEDIA_DARLING`/`ACH_LONELY`），"影响媒体/孤独"真正生效。
> **落地明细（候选 ID → 事件 ID → 接入点）**
> | 候选 ID | 事件 ID | 史实锚点 | 接入点 |
> | --- | --- | --- | --- |
> | 8_1b 全息归来 | `8_1b` | 2014 Billboard 全息演出 | `8_1 → 8_1b → 8_2` |
> | 8_2b 遗作《Xscape》 | `8_2b` | 遗作专辑（2014） | `8_2 → 8_2b → 8_3` |
> | 8_3b 遗产税争议 | `8_3b` | 遗产管理委员会 vs IRS（2013 起诉，2017 判决） | `8_3 → 8_3b → 8_5b` |
> | 8_5b 舆论风波 | `8_5b` | 纪录片公共讨论（2019） | `8_3b → 8_5b → 8_4` |
> | 8_4b 《MJ the Musical》 | `8_4b` | 百老汇音乐剧首演（2022-01） | `8_4 → 8_4b → 8_4c` |
> | 8_4c 《Thriller 40》周年 | `8_4c` | 40 周年企划（2022 宣布，2023 专辑） | `8_4b → 8_4c → 8_5` |
> | 8_7 留给后人的话 | `8_7` | 收束前遗产寄语（依 `dominantMeta` 生成） | `8_5 → 8_7 → 8_6` |
> - 续章专属变体池 `V_POST_*`：`V_POST_TRIBUTE`(年轻一代翻唱致敬, 窗口[2010,2026], weight35)、`V_POST_HOLO`(AI·全息巡演争议, 窗口[2014,2026], weight30, cond `art≥80`)、`V_POST_FAMILY`(家族内部版权争执, 窗口[2013,2026], weight25, cond `sonySold‖mogul≥1`)。
> - 续章专属成就：`ACH_HOLOGRAM`(全息归来, flag `hologramSeen`)、`ACH_MUSICAL`(百老汇音乐剧, flag `mjMusical`)，呼应"可触发专属成就"设计。
> - 完整链路：`8_0 → 8_1 → 8_1b → 8_2 → 8_2b → 8_3 → 8_3b → 8_5b → 8_4 → 8_4b → 8_4c → 8_5 → 8_7 → 8_6`，经 `survived2009` 路由收束 `END_TIMELESS_PRESENT`（及 §7.2 规则 3b 链），en_smoke 续章链路遍历 0 错误。

### 17.3 主线相对偏薄的章节（次要拓展位）
> 主线七章整体饱和（总节点 ~100+），但两章密度偏低，可作次级拓展：
- **第二章 · 单飞与 Off The Wall（1978–1981）**：【已落地 g5】新增 `2_6` 格莱美加冕之夜（1981，深化与昆西·琼斯的黄金搭档，呼应 M1 关系系统 `rel.quincy`），并修复原 `2_5` 格莱美表演为死节点（solo 路径现可经 `2_4→2_5→2_6→3_1` 贯通）。Diana Ross 合作深化已在单飞线落地为节点 `2_7`（1981，2_6→2_7→3_1；选项写入 `flags.dianaBond`）。
- **第四章 · Bad 与梦幻庄园（1986–1990）**：【已落地 g5】新增 `4_4` 后《Bad》时代（1989，商业版图 / 回归家庭 / 先锋作品三选），填补 `4_3→5_1` 间空白。其余候选（1984 格莱美、We Are The World 公益声望可作第三章边界桥接）保持开放。

### 17.4 深度游玩系统（系统厚度与策略深度）✅ 已落地
> 在现有"6 属性 + 4 元路线 + 34 变体 + 18 结局"骨架上增加**可操作的策略层**，让选择从"三选其一"升级为"经营一条人生线"。
- **创作企划器（专辑 / 巡演自定义）**：在 `3_1/4_2/5_1/6_1` 等创作节点后，插入"企划"子决策——选风格（流行/摇滚/实验）、预算（保守/激进）、合作者（昆西/后辈/独立）。不同组合改变 `art/wealth/stress` 回报的**方差**，高风险高回报，强化经营感。
- **专项子维度**：在 `art` 下细分「舞蹈 / 作曲 / 制作」，`reputation` 下细分「公众 / 乐评 / 商业」。让"卓越档（⭐+N）"更有层次，且不同结局读取不同子项（如 END_ETERNAL 看「乐评+舞蹈」而非笼统艺术）。
- **关系网深化（扩展 M1）**：现有 6 具名 NPC 好感基础上，新增**关系专属事件**与**破裂/和解分支**（如"与昆西决裂→后期艺术受限""与子女和解→晚年家庭+温暖"），关系门槛解锁隐藏事件与结局微分支。
- **决策风格档案**：后台统计玩家长期倾向（激进 / 稳健 / 隐逸），影响 `hint` 语气与变体事件权重，使"同一局"呈现不同纹理。

#### 17.4.1 落地明细（g9）
- ✅ **专项子维度展示层**：`engine.buildSubDims` 把 §17.14 创作企划器写入的 `cp_*` 画像（视野/创新/制作/合作/舞台呈现）转为结局页"专项造诣"进度条；**不改核心结局逻辑**。
- ✅ **决策风格档案**：`engine.decisionStyle` 依 `cp_*` 与元路线派生风格（先锋开拓者/稳健匠人/商业谋略/温润善者/隐居哲思/随性探索），结局页"专项造诣"标题区展示，并作为 hint 语气/变体权重的基础（本期仅展示，未硬改判定）。
- ✅ **关系网深化（flavor 变体）**：新增 `V_REL_QUINCY`（昆西·琼斯 决裂/和解）与 `V_REL_KIDS`（与子女和解）两个窗口变体，写入 `rel` 好感与 `relQuincyMend`/`kidsReconciled` 标志，沉淀进 M1 关系面板与"暖心家长"等成就；具名 NPC 全事件体系留作后续。
- ✅ **合规/门禁**：纯侧写/展示层，零数值硬影响、不触 §15.1；`npm test` 全绿（149 事件、EN 残留 0、`check_variant_windows` 无新冲突、en_smoke 200 局 0 异常）。

### 17.5 重复游玩增强（重玩性）★无限暂缓
> ⏸️ **无限期暂缓（用户 2026-09-04 决定）**：优先推进 §17.4 / §17.6 / §17.12；本节的挑战/每日模式、纯净/硬核、NG+、结局达成向导、最接近结局提示均暂缓，后续再排期。
> 目标：让"集齐 18 结局 + 56 成就"之外，仍有持续回来玩的理由。
- **挑战 / 每日模式**：固定随机种子 + 目标（指定结局 / 指定传奇评分 S 级 / 速通 N 节点），可生成可分享的挑战码；速通榜呼应现有"1969 留盖瑞"速通路径。
- **纯净模式 / 硬核模式**：纯净模式关闭变体事件（剧情党）；硬核模式属性任一项归零即锁定对应负面结局（如 `health=0`→悲剧类），提升紧张感。
- **NG+ 轻量版（区别于已延迟的 M10）**：二周目起解锁"先知笔记"——在节点旁显示"你曾在此选过 X"的回看提示；或"遗产加成"小幅继承上局 `netWorth`（非属性），作为温和重玩激励。
- **结局达成向导**：图鉴中每个结局提供"反推关键选择路径"（如 END_TRUE_ETERNAL 需 拒百事+艺术满投入+双加冕+慈善×3），强化收集驱动，且**不**引入已延迟的 M12 回放时间轴。
- **最接近结局提示**：结局页/图鉴显示"本局最接近未达成的 X 结局，差在 Y"，引导下一次针对性重玩。

### 17.6 剧情与文案拓展（故事性 · 代入感）✅ 已落地
- **独白与尾声扩写**：按"章节 + 元路线 + flag"程序化扩展 MJ 第一人称 `monologue` 与结局长文（100→200 字），不同结局呈现不同尾声基调；复用 M2 手记机制，结局页"人生手记"汇总更丰满。
- **媒体舆论轴深化（扩展 M5）**：将 `V_RUMOR` 升级为持续系统——谣言/澄清/反转事件链，影响 `media`（0–100，M5 已规划）与 `reputation`，使 END_CONTROVERSIAL 更丰富、可触发专属"舆论反转"微分支。
- **心理轴事件扩写（扩展 M6）**：`孤独` 维度（已实现）触发更多童年闪回（盖瑞童年 / 父亲严苛训练），增强悲剧/隐士基调，并与 END_RECLUSE / END_TRAGIC 收束文案联动。
- **时代切片扩写（扩展 M3）**：在现有 5 章时代卡片之外，增补关键文化节点（MTV 诞生、CD 盛世、互联网兴起、9·11 前后）的文本厚度，强化"选择锚定真实时空"。

#### 17.6.1 落地明细（g9）
- ✅ **MJ 语录 / 歌词 系统（核心落地）**：新增 `MJ.quoteSystem`（`engine.js`，与趣事/彩蛋同构），内置 12 条 MJ 本人公开词句/歌词（Man in the Mirror / Heal the World / Billie Jean / Beat It / Thriller / Smooth Criminal / On Craft / On the Child Within / On Perfection / On Love / On Music / On Legacy），以"语录图鉴（Quote Codex）"形式收藏（localStorage + Toast 队列 + 弹窗），开场与结局菜单均接入"语录图鉴"按钮。
- ✅ **语录植入位置（回答"加在哪合适"）**：① 结局页——按结局基调从语录库挑一句注入独白之后（慈善家→《Heal the World》、隐士→《On the Child Within》等），标"（语录）"；② 关键事件——`3_1` 创作企划写入 `quote_mirror` 标志，游玩中即时解锁《Man in the Mirror》并弹 Toast；③ 图鉴——可随时翻阅全部语录。选位原则：歌词/名言本就是 MJ 的"声音"，放结局与人生手记最贴合原味，且零数值影响、符合 §15.1。
- ✅ **EN 全量**：`quote.*` / `ui.quote*`（图鉴/Toast/标签）入 `i18n.js`（歌词原文为英文，中英模式同显原味）；`find_missing_en`=0，EN 模式 0 中文残留。
- ⏸️ **后续（本期未做）**：独白/尾声逐结局 100→200 字扩写、M5 舆论轴事件链、M6 心理轴童年闪回事件、M3 时代切片逐章增厚——均作为 §17.6 后续批次，本期以"语录/歌词系统 + 结局注入"为主落地，门禁已验证。

### 17.7 更多结局候选（★已落地｜2026-09-04 拓展批次：14 → 18 结局）
> 在 §7.2 规则表**默认之前**追加新结局（保持 1→N 顺序唯一、元路线破平规则不变），现有 18 结局门槛与优先级不受影响。
> **已落地（2026-09-04）**：4 个新结局 END_STATESMAN / END_INNOVATOR / END_MENTOR / END_RECLUSE_SERENE 已写入 `config.endings` 与 `resolveEnding` 规则表（RECLUSE_SERENE 先于 RECLUSE；INNOVATOR 在 MOGUL 后；MENTOR/STATESMAN 在 PHILANTHROPIST 后），并各带稀有度成就，EN 文案同步；另新增 `collab` 元路线计数支撑 MENTOR 触发。
| 候选结局 | 名称/基调 | 触发门槛（示例） | 插入位置 |
| --- | --- | --- | --- |
| END_STATESMAN | 🤝 文化大使（温暖、受敬） | `phil>=2 && rep>=70 && family>=55 && !debt` | 慈善之后、永恒之前 |
| END_INNOVATOR | 🚀 音乐技术先驱（先锋、冷峻） | `art>=80 && mogul>=1 && 曾选「实验/科技」企划` | 巨擘之后 |
| END_MENTOR | 🌟 提携后辈（仁爱、传承） | `collab>=2 && family>=50 && art>=60` | 慈善之后 |
| END_RECLUSE_SERENE | 🏔️ 平和隐士（释然、安宁） | `recluse 最高 && health>=55 && 孤独<35` | 隐居之后，区别于现有孤独型 END_RECLUSE |
| 续章子结局×2 | 在场的不朽·长老 / 在场的不朽·传奇导演 | `survived2009` 下按 `dominantMeta` 进一步细分 | 续章收束链内 |
> 新增结局须同步：① 写 `config.endings` 条目 ② 在 `resolveEnding` 规则表插入（含优先级）③ 补 `ending.*` i18n 文案 ④ 加对应成就（稀有度）⑤ 海报/图鉴支持。

### 17.8 更多事件与架空分支（忠于生平 + 明确标注架空）★已落地（2026-09-04）
> 状态：A 生平补全、B 架空分支、C 续章密度**均已实现**。其中 A 采用「窗口化变体（V_BIO_*）」方式自然插入主线（不重写 `next` 链，保证主线稳定）；B/C 此前已在主事件与续章中落地。GDD 表中候选 ID 已对应落地为下方变体/分支。
**A. 生平补全事件（忠实 MJ 真实年表，接入主线 `next` 链）**
| 候选 ID | 年 | 标题 | 史实锚点 | 玩法 / 维度 |
| --- | --- | --- | --- | --- |
| 1_2c | 1978 | 《新绿野仙踪》缘起 | 结识昆西·琼斯（电影拍摄） | 关系（昆西）+艺术，呼应 M1 |
| 3_1d | 1983 | Motown 25 幕后 | 月球漫步诞生前夜 | 艺术+压力抉择，强化 §6.3 单飞线 |
| 4_2a | 1988 | 《Bad》世界巡演 | 单飞后首次全球 solo 远征（123 场中的代表节点） | 财富+声誉+压力，接 `4_3` |
| 6_1e | 1996–97 | HIStory 世界巡演 | 当时 solo 艺人最大规模巡演 | 财富+声誉，接 `6_2` |
| 6_3a | 2001 | 9·11 与三十周年 /《Number Ones》 | 赴废墟旁义演（史实） | 慈善+声誉，接 `6_4` |
| 5_6 | 1995 | 与 Freddie Mercury 合作遗珠 | 慈善合唱《There Must Be a Way》（史实素材） | 艺术+慈善，解锁隐藏独白 |
| 3_6b | 1985 | 格莱美之夜 | 凭 Thriller 垄断奖项（史实） | 声誉+艺术，强化巅峰 |

**B. 架空历史分支（凡架空处明确标注，遵循 §15.1 中性规范）**
| 候选分支 | 入口节点 | 架空设想 | 影响 |
| --- | --- | --- | --- |
| 早期小镇支线 | `1_3` 留盖瑞 | 不单飞但留盖瑞发展成"小镇传奇"微型线 | 新微结局/事件，独立于现有 END_PLAIN |
| 1984 未烧伤健康线 | `3_2` | "若那簇火没烧到你"（已埋伏笔）→ 减少后续止痛药依赖分支 | 健康线更宽，影响 END_ART_PEAK/END_TRAGIC 达成难度 |
| 1993 抗辩到底 | `5_3` | 拒庭外和解、应诉到底 | 法律线不同收束，影响 `media`/争议 |
| 与索尼提前决裂 | `6_1b` | 更早回购/反收购 Sony/ATV 半数股权 | 商业线更激进，丰富 mogul 路径 |
| Neverland 不同命运 | `4_1` | 公开博物馆化 / 彻底退出 | 财富与家庭权衡新维度 |
| 签约不同厂牌 | `2_4` | 自创厂牌 vs 与独立厂牌 | 艺术自主 vs 商业回报分化 |

**C. 续章密度提升（扩展 §17.2）**：在 `8_0`–`8_6` 间再插 `8_1b 全息归来(2014)`、`8_2b 遗作《Xscape》(2014)`、`8_3b 遗产税争议(2013–17)`、`8_4b《MJ the Musical》(2022)`、`8_4c《Thriller 40》(2022–23)`、`8_5b 舆论风波(2019)`、`8_7 留给后人的话(2026+)`，并新增 `V_POST_*` 续章专属变体池（年轻一代致敬 / AI 全息巡演争议 / 家族版权争执），显著拉长「在场的不朽」线。

### 17.9 彩蛋系统（Easter Eggs · 系统化）★已落地（2026-09-04）
> 状态：8 个彩蛋（月球漫步起源 / 反向歌词 / 梦幻同台 / 同一首歌 / 老友重聚 / 迪斯科致敬 / 开发者留言 / 第四面墙）+ 跨周目持久化（localStorage）+ 彩蛋图鉴 + Toast 均已实现，落地于引擎 `MJ.eggSystem` 与 UI `toastEgg/eggModal`。触发方式见原节正文。
> 现有：chinaVisit 访华已实现为隐藏变体；成就叙事化（M11）已无限期延迟。本小节将"彩蛋"**系统化**为可发现、可收藏维度。所有彩蛋以"隐藏变体 + flag + 成就"形式落地（复用 `V_*` 机制与成就系统），**中性、不影响数值平衡**。
- **符号 / 歌词彩蛋**：连续多次选择"月球漫步"相关选项 → 解锁《Smooth Criminal》反向歌词梗与隐藏台词；在 `3_1b` 选"完美演绎"达 N 次（跨周目累计）解锁"月球漫步起源"幕后。
- **致敬联动彩蛋**：集齐 `artPath>=2 + anniv2001 + thriller25` → 解锁"与猫王 / 披头士梦幻同台"文本彩蛋（纯文本，架空致敬，标注"想象"）。
- **元彩蛋（第四面墙）**：集齐 56 成就后解锁"开发者留言"独白；连续 5 周目完成解锁"致每一位重写传奇的你"旁白。
- **节点 / 年份彩蛋**：`3_5` 写《We Are The World》选特定和弦 → 隐藏慈善独白；新增"迪斯科致敬""Motown 老友重聚"等隐藏变体。
- **发现反馈**：彩蛋触发时轻量 toast + 计入"彩蛋图鉴"（独立于成就），鼓励探索式重玩。

### 17.10 优化与性能提升（UX / 技术）★规划
- **移动端体验**：海报 Canvas 离屏预渲染并缓存（避免每次重绘抖动）；长文本分段减少重排；触控热区放大、按钮间距适配拇指操作。
- **性能**：事件 / 变体数据懒加载；存档压缩（LZ 类）；单文件产物进一步瘦身（去重内联、gzip 友好）。
- **可访问性**：字号调节（A-/A+）、高对比模式、完整键盘导航（Enter 已有，扩展 Tab / 方向键 / Esc 关闭弹层）。
- **轻量数据可视化（替代已延迟的 g6）**：不引入雷达图/时间轴，而以**纯文本/字符**呈现"人生曲线"（各属性随年变化用 sparkline 字符或统计摘要），在结局页展示，零额外依赖。
- **社交增强**：分享文案多模板（励志 / 自嘲 / 史诗）；海报多套色调与排版预设（暗金经典 / 极简黑白 / 续章冷蓝），提升传播欲。

### 17.11 MJ 趣事与「MJ 可能会干的事」（flavor / 轶事系统）✅ 已落地
> 目标：在"传记严肃性"之外，补一层**轻盈、有人情味、可收藏**的 MJ 侧写，强化粉丝向情感连接；全程遵守 §15.1 中性化与"明确标注架空"约束。

- **趣事图鉴（Trivia Codex）**：新增 `MJ.triviaSystem`，内置 20–30 条考据趣事（真实可考 + 明确标注"坊间/轶事"），如：为慈善悄悄代付陌生人账单、排练到凌晨逐帧抠动作、给 Neverland 动物过生日、用拟声词给乐队讲编曲、收藏连环画与科幻片、给歌迷手写回信。图鉴可翻阅、可"分享一条趣事"。中性、零数值影响。

- **偶发 flavor 事件（轻量变体 `V_TIDBIT`）**：以低概率插入"生活切片"——如「深夜录音棚的一杯热可可」「给猴子 Bubbles 写日记」「和侄子们打游戏」——纯 flavor（无属性变化或仅 ±1 软性），选项为轻互动/旁观，丰富"人"的温度。窗口随周目年份，权重低，不干扰主线 `next` 链。

- **「MJ 可能会干的事」（hypothetical vignettes）**：按 `dominantMeta` + flag 程序化生成的"假如…"微片段，呼应 §2.2 蝴蝶效应与 §5.7 重玩性。例如艺术家路线"若当晚你没登台，是否会一个人看回放看到天亮？"；慈善家路线"若你建的不是庄园而是学校？"；隐士路线"若你关掉所有聚光灯，听见的第一种声音是什么？"。以第一人称、留白式短文呈现，可收藏进"人生手记"（扩展 M2）。**全部明确标注"（想象）"**，不与史实混同。

- **实现建议**：趣事图鉴与 flavor 变体复用现有 `V_*` 机制 + 图鉴式 localStorage（仿 §17.9 彩蛋图鉴）；hypothetical vignettes 复用 M2 手记模板，在章节过场或结局页"人生手记"追加。成本低、惊喜感高、粉丝向强。

#### 17.11.1 落地明细（g8）
- ✅ **趣事图鉴 `MJ.triviaSystem`**（`engine.js`）：内置 24 条考据趣事（图标＋名称＋描述＋条件），复用 `localStorage` 持久化与 Toast 队列；`count()/total()/foundList()/unlock()/checkFlags()/revealAll()` 齐备。`checkFlags` 扫描 `state.flags` 中 `tidbit_*` 前缀→解锁 `TRIVIA_<UPPER>`；`revealAll` 在结局时按各条目 `cond` 扫描玩家人生解锁"考据趣事"。
- ✅ **偶发 flavor 变体 `V_TIDBIT_*`**（`events.js`）：6 个低权重变体（`V_TIDBIT_COCOA`/`BUBBLES`/`NEPHEWS`/`QUIET`/`GARDEN`/`REHEARSE`，窗口 1979–2009），纯氛围、±1 软性属性、选项 `next:'__RETURN__'` 回到主线；前 4 个写入 `tidbit_*` 标志即时解锁图鉴条目并弹"趣事发现"Toast。
- ✅ **hypothetical vignettes**（`config.vignetteTemplates` + `engine.buildVignettes` + `ui.vignettePanel`）：按 `dominantMeta` 生成"假如…（想象）"微片段，结局页"人生手记"后单独成面板，统一标注"（想象）"。
- ✅ **UI**：仿 §17.9 新增趣事图鉴弹窗（`triviaModal`）、计数与 Toast（`triviaCount`/`toastTrivia`，青绿调区别于彩蛋紫调），开场与结局菜单均接入"趣事图鉴"按钮；结局页开头触发 `revealAll`。
- ✅ **EN 全量**：`trivia.*`/`ui.*` 入 `i18n.js`，`event.V_TIDBIT_*`/`vignette.*` 入 `i18n_events_en.js`；`find_missing_en`=0，EN 模式 0 中文残留。
- ✅ **合规/门禁**：仅中性、零数值影响的侧写，不触碰 §15.1 红线、不影响任何结局判定；`npm test` 全绿（147 事件、EN 残留 0、`check_variant_windows` 修正同变体自比较误报后无新冲突、en_smoke 200 局 0 异常）。

### 17.12 更多成就 + 成就/彩蛋弹窗双发修复 ✅ 已落地
> 现状：成就 56 项（§17 已实现，含稀有度排序与可重置图鉴）。目标：① 扩充主题化成就；② 修复"一次性弹出两个"的弹窗重叠（见 §16.1 第 2 条，UI 队列方案已落地于 `ui.js` 的 `_enqueueToast`/`_pumpToast`）。

- **新增成就候选（建议 id / 名称 / 稀有度 / 触发 sketch）**：
  | id | 名称 | 稀有度 | 触发 sketch |
  | --- | --- | --- | --- |
  | ACH_DANCE_GOD | 舞以载道 | epic | 单局内触发 ≥3 次"月球漫步/完美演绎"类选项（artPath 累计） |
  | ACH_PHIL_3 | 仁心三叠 | rare | `phil>=3`（≥3 次慈善选择） |
  | ACH_CHARITY_CONCERT | 义演之魂 | rare | 触发 ≥2 个慈善/义演事件（flag: charityConcert>=2） |
  | ACH_CATALOG_KING | 版权之王 | epic | 同时持有 ATV + Sony/ATV 半数 + 自创厂牌（mogul>=2） |
  | ACH_SMOOTH | 反重力先生 | rare | 在 `3_1b` 选"完美演绎"≥2 次（跨周目 `moonwalkPerfect`） |
  | ACH_PEACE_3 | 和平使者·三 | rare | `phil>=3 && reputation>=70` |
  | ACH_LONELY_KING | 高处孤光 | epic | `孤独>=50 && reputation>=80`（呼应 M6） |
  | ACH_FAMILY_WARM | 灯火可亲 | rare | `family>=80` 且子女和解线达成 |
  | ACH_COMEBACK_2 | 二度加冕 | epic | 经历 `health` 危机后 `art>=85` |
  | ACH_EGG_HUNTER | 彩蛋猎人 | legendary | 集齐全部 8 彩蛋（`eggSystem.count()>=8`） |
  | ACH_VARIANT_20 | 千面人生 | epic | 单局触发变体 ≥20 次（`state.stats.variants>=20`） |
  | ACH_ALL_ENDINGS | 万相皆我 | legendary | 图鉴解锁全部 18 结局 |
  | ACH_SPEEDRUN | 盖瑞到巅峰 | rare | 速通达成（节点数 ≤ N 且未走支线） |
  | ACH_PACIFIST | 不羁之风 | rare | 全程零 `legal` 争议（未触发任何法律事件负面） |

- **双发修复方案（已落地 UI 队列）**：见 §16.1 第 2 条。`showEvent`/`showEnding` 评估成就后，统一经 `toastAchievement` → `_enqueueToast` 串行弹窗；`eggSystem.onEnding` 移除冗余 `achievementSystem.evaluate`。新增成就时只需在 `config.achievements` 追加 `{id,name,icon,rarity,desc,check}`，弹窗与图鉴自动适配。

- **验收**：新增成就须同步 ① `config.achievements` 条目 ② `ach.<id>.name/desc` i18n（含英文 `i18n_events_en.js`）③ 图鉴/海报展示 ④ 不破坏 30/总 计数与"集齐全部"判定。

#### 17.12.1 落地明细（g9）
- ✅ **新增 14 项成就**（`config.achievements`，总成就 30→44）：舞王/慈善三重奏/义演行者/版权之王/完美月球漫步/和平使者/孤独的王/暖心家长/王者归来/彩蛋猎人/变体收藏家/人生百态/速通人生/清白之躯；各自 `check` 已对接现有 `state` 数据（元路线、`cp_*`、法律/子女/健康标志、`state.stats.variants/events`、跨周目 `eggSystem` 与 `saveSystem` 图鉴）。
- ✅ **支撑数据**：`3_5`/`5_2b` 义唱写入 `charityConcert` 标志（支撑"义演行者"）；`V_REL_KIDS` 写入 `kidsReconciled`（支撑"暖心家长"）；"双发修复"UI 队列（`_enqueueToast`）此前已落地，本期新成就自动适配。
- ✅ **EN 全量**：14 项 `ach.<id>.name/desc` 入 `i18n.js`；图鉴/海报"44 总"计数与"集齐全部"判定自动更新；`find_missing_en`=0，EN 残留 0。

> 实施建议：上述规划项按"性价比 + 与现有系统耦合度"排期；优先落地 §17.9 彩蛋（复用 V_*/成就，成本低、惊喜感高）、§17.11 趣事/轶事（粉丝向、低成本）。凡架空内容务必遵循 §15.1 中性化规范与"明确标注架空"。

### 17.13 「假如」时间线变体 + 未竟梦想（hypothetical / unrealized-dream variants）★规划
> 目标（用户新需求）：① 把"假如 MJ 从 Off The Wall 到 Invincible 每张专辑都横扫格莱美"这类假设，做成**可触发、可到达、符合现有模块**的变体；② 把 MJ**生前未实现的梦想**（彼得潘电影、长城演唱会、生前音乐剧、完成 This Is It 驻演、太空演唱会…）也做成变体/成就，丰富"如果当初…"的蝴蝶效应。
> 全部沿用既有 `V_*` 变体机制（`engine.pickVariant` + events.js `variant:true`），**不引入新子系统**；架空处严格遵循 §15.1（标题/正文含"（想象）"、不加法律/诽谤内容）。

#### 17.13.1 机制：如何加入"假设/梦想"变体（复用现有模块）
- 变体对象形态（与 `V_BIO_*`/`V_OFFER` 完全一致）：
  ```js
  E.V_GRAMMY_INVINCIBLE = {
    id: 'V_GRAMMY_INVINCIBLE', variant: true, window: [2001, 2002], weight: 35,
    title: T('event.V_GRAMMY_INVINCIBLE.title', null, '（想象）Invincible 的格莱美之夜'),
    kind: 'choice',
    text: function (s) { return '...'; },
    options: [
      { label: T('event.V_GRAMMY_INVINCIBLE.opt0.label', null, 'A：让《Invincible》也站上领奖台'),
        next: '__RETURN__', flags: { grammy_invincible: true },
        effects: { rep: 8, art: 6 } },
      { label: T('event.V_GRAMMY_INVINCIBLE.opt1.label', null, 'B：让历史停留在它本来的样子'),
        next: '__RETURN__' }
    ]
  };
  ```
- **可达性保证**：`engine.pickVariant(year)` 以"当前主线事件的 `year`"比对变体 `window`，命中则在该主线事件**之前**插入一次（显示年份继承父事件，避免时间倒挂，见 engine.js L214–253）。因此只要变体的 `window` **覆盖图里某个主线节点的年份**，玩家沿该路线推进时即可触发（再受 `weight` 概率与可选 `cond` 门控，`_usedVariants` 保证同周目不重复）。下表已逐条对齐主线年份。
- **解锁联动**：选项写入 `flags:{grammy_*, dream_*}`；结局时由 `MJ.eggSystem.checkFlags`（扫描 `egg_` 前缀）或新增成就 `MJ.achievementSystem.evaluate`（读 `state.flags`）统一判定并**串行**弹窗（见 §16.1/§17.12 队列方案）。无需新增 UI。

#### 17.13.2 「格莱美全满贯」假设变体（史实 vs 想象，逐项标注）
> 史实校准（来源：GRAMMY 官方 / 传记年表）：OTW 1979→1980 获 **1** 座（最佳男 R&B《Don't Stop 'Til You Get Enough》）；Thriller 1982→1984 单夜 **8** 座（历史纪录，主线 3_3 已落地）；Bad 1987→1988 获 **2** 座；Dangerous 1991→1993 获 **1** 座（《Jam》最佳男 R&B）；HIStory 1995 专辑 **0** 座（但《Scream》MV 于 1996 获最佳短篇 MV 1 座）；Invincible 2001 **0** 座。即 1979–1991 每张个人专辑**均获奖**为史实，"连 HIStory/Invincible 也横扫"才是假设。

> **⚠️ 已废弃 / 并入 §17.14（v0.6 决议，提交 070132a）**：本节原拟的 `V_GRAMMY_*` 变体方案**不再以变体形式实现**。理由：(1) §17.14 已将格莱美改为"创作企划 + 巡演 → 涌现结算"（`planner.resolveGrammy`），成就 `ACH_GRAMMY_SWEEP` / `ACH_GRAMMY_LEGEND` 已通过该涌现系统落地——若再写 `V_GRAMMY_*` 变体会与涌现结算**重复计奖**；(2) 防回归约束 `test/check_dup_events.cjs` 已**禁止变体写入 `grammy_*` 标志 / 出现 `V_GRAMMY*` id**（防止历史 bug 回潮）。"全满贯"现作为**可被玩家凭运营达成的涌现成就**存在，而非强制假设变体。下表保留仅作考据存档。

| id | 锚定主线年 | window | 史实/想象 | 触发 flag | 软性效果 |
| --- | --- | --- | --- | --- | --- |
| V_GRAMMY_OTW | 2_3/2_4/2_5 (1979–80) | [1979,1980] | 史实(已获奖) | grammy_otw | rep+5,art+5 |
| V_GRAMMY_THRILLER | 3_3 (1984) | [1983,1984] | 史实(已获奖) | grammy_thriller | rep+8,art+6 |
| V_GRAMMY_BAD | 4_2 (1987) | [1987,1989] | 史实(已获奖) | grammy_bad | rep+5,art+5 |
| V_GRAMMY_DANGEROUS | 5_1/5_2 (1991–92) | [1991,1993] | 史实(已获奖) | grammy_dangerous | rep+5,art+5 |
| V_GRAMMY_HISTORY | 6_1/6_1c (1995–96) | [1995,1996] | 想象(专辑未 sweep) | grammy_history | rep+6,art+4 |
| V_GRAMMY_INVINCIBLE | 6_3b (2001) | [2001,2002] | 想象(未获奖) | grammy_invincible | rep+6,art+4 |

- 集齐 6 个 `grammy_*` flag（单周目）→ 成就 **ACH_GRAMMY_SWEEP（legendary）「格莱美大满贯」**："从《Off The Wall》到《Invincible》，你让每一座奖杯都写上了自己的名字——哪怕有些只存在于想象里。"

#### 17.13.3 未竟梦想变体（生前未实现，皆标注"想象"）
> 均基于可考的 MJ 生平意向（Peter Pan 版权与饰演执念、1987 长城演唱会设想、导演/制片抱负、儿童医院设想、2009 This Is It 驻演因离世取消、生前音乐剧设想、零重力/太空演出传言）。不做法律/诽谤表述。

| id | 锚定主线年 | window | 梦想 | flag | 效果 / 备注 |
| --- | --- | --- | --- | --- | --- |
| V_PETERPAN | 4_1 之后 (1987–2005) | [1987,2005] | 饰演并拍摄《彼得潘》（他购入版权、曾含泪恳求；Neverland 得名由来） | dream_peterpan | art+8,family+5 |
| V_GREATWALL | 4_1/4_2 (1987–88) | [1987,1988] | 在北京长城开唱（当年未获许可） | dream_greatwall | rep+10,art+6 |
| V_FILMSTUDIO | 4_0 之后 (1986–1995) | [1986,1995] | 建立自己的制片厂 / 亲自执导 | dream_filmstudio | art+8,mogul+1 |
| V_CHILDHOSP | 4_1 之后 (1987–2005) | [1987,2005] | 在 Neverland 建儿童医院 / 疗愈地 | dream_childhosp | phil+1,family+5,rep+5 |
| V_THISISIT_DONE | 7_2 (2009) | [2009,2009] | 完成伦敦 O2 50 场驻演（史实因离世取消） | dream_thisisit | rep+12,art+10（cond：survived2009 或纯想象） |
| V_MUSICAL | 6_1 之后 (1995–2005) | [1995,2005] | 生前推出百老汇音乐剧（史实 2022 追授） | dream_musical | art+8,rep+6 |
| V_SPACE | 1990–2005 | [1990,2005] | 零重力 / 太空演唱会（与维珍合作传言） | dream_space | rep+10,art+6（纯想象 vignette） |

- 集齐 ≥3 个 `dream_*` flag → 成就 **ACH_DREAMER（epic）「造梦者」**："你替那个男孩，把清单上没划掉的项，一一点亮了。"
- 单项成就：**ACH_PETERPAN（rare）**、**ACH_GREATWALL（rare）**、**ACH_THISISIT（epic）「未竟之演」**。

#### 17.13.4 验收与落地清单
- 变体：在 `events.js` 追加上述 `V_*` 对象（沿用 `T()` 包裹 + `eventEn` 英文键，回退链兼容；i18n 同步译 EN，确保英文模式 0 残留）。
- 成就：在 `config.achievements` 追加 ACH_GRAMMY_SWEEP / ACH_DREAMER / ACH_PETERPAN / ACH_GREATWALL / ACH_THISISIT（`{id,name,icon,rarity,desc,check}`），`check` 读 `state.flags`。
- 回归：en_smoke 校验新事件 EN 无中文残留；smoke.cjs 年份单调断言不因新变体破；`_usedVariants` 保证同周目不重复触发。
- 合规：所有"想象"变体标题/正文含"（想象）"前缀，遵循 §15.1 中性化。

> 实施建议：优先做 §17.13.2 格莱美全满贯（与现有 3_3 格莱美主线呼应、史实扎实、成本低）+ §17.13.3 中 V_PETERPAN / V_GREATWALL / V_THISISIT_DONE（考据明确、粉丝向强）；V_SPACE 等纯想象 vignette 作为后续点缀。

### 17.14 创作企划器 + 巡演自定义 → 格莱美涌现联动 【已落地 g6：六 era 全链路 + 2 成就】
> 修订 §17.13：格莱美**不再写死逐年必拿**，改为由"创作企划（待定）+ 巡演自定义"在揭晓时**动态结算**。§17.13 的"全满贯"从"强制假设"降级为"可被玩家凭运营达成的涌现成就"——呼应需求"格莱美不一定摇年年拿"。
> 全部复用现有模块（`flags` 数值化、`onEnter` 钩子、`meta` 计数、`achievementSystem`），**不新增子系统**。

#### 17.14.1 设计目标
- 每张专辑的格莱美战绩 = f(企划质量, 巡演呈现, 当下声誉/艺术势头, 时代基线 bias)。
- 低质企划 / 疲于奔命的巡演 / 低谷期 → 提名未中（贴合 HIStory/Invincible 史实 0 座）。
- 高水平且稳定的多线运营 → 才有可能逐张收割，最终触发"全满贯"。

#### 17.14.2 三阶段数据流
1. **企划（待定）**：专辑发行节点改为 `choice`"企划"，选项写入 `cp_vision/cp_craft/cp_innovation/cp_collab`（0–100 绝对画像；不同维度=不同 flag，天然叠加）。
2. **巡演自定义**：既有巡演节点（4_2a/5_2/6_1e/3_2b）的选项追加 `cp_stagecraft`（舞台呈现）与可选 `cp_craft` 微调。
3. **揭晓（解析）**：格莱美揭晓节点加 `onEnter` 钩子 → 调 `MJ.planner.resolveGrammy(state, albumKey)`，读 `cp_*` + 属性 → 写 `flags.grammy_<album>`（座数，0=提名未中）、累加 `meta.grammyWins`、直接 `changeAttr` 给声誉/艺术加成。

#### 17.14.3 数据 schema（零侵入）
- 复用 `flags`：`cp_vision, cp_craft, cp_innovation, cp_collab, cp_stagecraft`（数值型 flag，沿用 `setFlag`/`serialize`，无需改 state.js）。
- `flags.grammy_<album>`：`otw|thriller|bad|dangerous|history|invincible` → 座数（0–8）。
- `meta.grammyWins`（新增非负计数）：`config.initialMeta` 加 `grammyWins:0`；解析时 `state.meta.grammyWins += wins`。
- 解析函数位置：新增 `js/planner.js`（或并入 engine.js），`MJ.planner.resolveGrammy`。

#### 17.14.4 resolveGrammy 公式（可实现，权重可按 §8 数值预算微调）
```js
MJ.planner.resolveGrammy = function (state, key) {
  var f = state.flags, a = state.attributes;
  var v=f.cp_vision||0, c=f.cp_craft||0, i=f.cp_innovation||0, co=f.cp_collab||0, st=f.cp_stagecraft||0;
  var momentum = ((a.reputation||0)+(a.art||0))/2;
  var q = 0.22*v + 0.18*c + 0.20*i + 0.12*co + 0.18*st + 0.10*momentum; // 0–100
  var bias = { otw:0, thriller:6, bad:3, dangerous:0, history:-4, invincible:-6 }[key] || 0;
  q = Math.max(0, Math.min(100, q + bias));
  var wins = q>=88 ? 6+Math.round((q-88)/3)
            : q>=75 ? 3+Math.round((q-75)/6)
            : q>=60 ? (q>=68?2:1) : 0;
  state.flags['grammy_'+key] = wins;
  state.meta.grammyWins = (state.meta.grammyWins||0) + wins;
  state.changeAttr('reputation', Math.min(20, wins*2));
  state.changeAttr('art', Math.min(8, wins));
  return wins;
};
```
> `bias` 让 Thriller 易登顶、HIStory/Invincible 须超常企划才破零，呼应史实又不锁死。

#### 17.14.5 事件流改造（均主线，天然可达）
- **专辑节点改企划 `choice`**：2_3(OTW)/3_1(Thriller)/4_2(Bad)/5_1(Dangerous)/6_1(HIStory)/6_3b(Invincible)。选项示例（Thriller）：A 概念史诗化 `{cp_vision:90,cp_innovation:85}` / B 商业稳赢 `{cp_craft:80,cp_collab:70}` / C 极简实验 `{cp_innovation:95,cp_craft:40}`。
- **巡演节点补 `cp_stagecraft`**：4_2a(A 全力→st:85,stress+)/6_1e/5_2/3_2b。
- **补 4 个格莱美揭晓节点**（`onEnter` 调解析，读取 `flags.grammy_<album>` 叙事）：`4_2a_g`(Bad, 1988, 接 4_2b) / `5_2g`(Dangerous, **year=1992** 以规避时间倒挂，接 5_2b) / `6_1e_g`(HIStory, 1996, 接 6_2) / `6_3b_g`(Invincible, 2002, 接 6_4b)；OTW 复用既有 `2_6`(加 onEnter)、Thriller 复用既有 `3_3`。
- 揭晓节点 `text` 按 `flags.grammy_<album>` 分档叙事（0=提名未中 / 1–2=小胜 / 3–5=多项 / 6+=大满贯），全部 `T()` 包裹 + EN 键。

#### 17.14.6 最小代码改动
| 文件 | 改动 | 风险 |
| --- | --- | --- |
| js/engine.js `go()` | 渲染前 `if (ev.onEnter) ev.onEnter(this.state);`（一行钩子，可复用于其他系统） | 低 |
| js/planner.js（新） | `resolveGrammy` 解析函数 | 低 |
| js/config.js | `initialMeta` 加 `grammyWins:0` | 低 |
| js/events.js | 6 个专辑节点改 choice + 4 个揭晓节点 + 巡演节点补 `cp_stagecraft` | 中（数据量） |
| i18n_events_en.js | 新文案 EN 键 | 低 |

#### 17.14.7 成就联动（涌现式）
- `ACH_GRAMMY_SWEEP`（改写 §17.13.2）：六张专辑 `grammy_*` 均 ≥1 → "从《Off The Wall》到《Invincible》，你让每一座奖杯都写上了自己的名字。"
- 新增 `ACH_GRAMMY_LEGEND`（epic）：`meta.grammyWins >= 18` 或单张 ≥6 → "格莱美史上的奇观：你把自己活成了纪录本身。"
- `dream_*` 成就（§17.13.3）保持不变。

#### 17.14.8 可达性 & 合规
- 全部挂在**主线节点**，玩家沿主线推进必经过；解析由 `onEnter` 保证在揭晓前完成，无 `window` 依赖、无时间倒挂风险（规避 §17.13 `pickVariant` 的 `window` 对齐约束）。
- 格莱美属非争议内容，§15.1 中性化无额外负担；新文案走 `T()`，en_smoke 校验 0 残留。
- 回归：smoke.cjs 年份单调断言不受影响（仅新增/改造主线节点，年份保持）；en_smoke 校验新事件 EN；serialise→hydrate 后 `grammyWins`/`grammy_*` 不丢（flags/meta 已序列化）。

#### 17.14.9 验收清单
- [x] planner.resolveGrammy 单测：给定 cp_* 档位输出座数符合阈值表（全满贯 7–8、零企划 0）。
- [x] 400 局随机冒烟：每 era 揭晓节点均触发、座数 ∈[0,8]、0 异常、0 时间倒挂。
- [x] 定向：低质企划→HIStory/Invincible 0 座；高质→可全满贯（两成就解锁）。

> **v0.6 命名修订（已实现，提交 c919c6e）**：为消除"格莱美之夜"等 6 处字面值撞名，格莱美揭晓节点统一按专辑命名——《Thriller》/《Bad》/《Dangerous》/《HIStory》/《Invincible》格莱美之夜；`V_BIO_GRAMMY84`→「加冕余温」、`V_BIO_WIZ`→「《新绿野仙踪》幕后」、`V_BIO_BADTOUR`→「《Bad》巡演侧记」、`V_BIO_HISTORYTOUR`→「HIStory 巡演侧记」（英文 i18n 同步）。孤儿节点 `1_7/1_8/4_4` 已接回（`1_6→1_7→1_8→2_1`、`4_3→4_4→5_1`）。变体事件不得写入 `grammy_*` 标志、不得出现 `V_GRAMMY*` id（§17.14 涌现结算专有，防重复计奖，见 `test/check_dup_events.cjs`）。
- [x] i18n EN 全量（find_missing_en=0）、en_smoke 通过；存档往返后计数不丢（flags/meta 已序列化）。

> 实施建议：先做 `planner.resolveGrammy` + engine `onEnter` 钩子 + Thriller 全链路（3_1 企划→3_3 揭晓）打通验证，再复制到其余五 era；权重用 §8 数值预算校准，使"全满贯"为小概率高光而非必然。
> 【已落地 g6】Thriller 验证链路 + 其余五 era（OTW/Bad/Dangerous/HIStory/Invincible）全已实现：`2_3/4_2/5_1/6_1` 改企划 choice、`5_2` 由 auto 改 choice、`6_3b` 选项补 `cp_*`；巡演 `4_2a/5_2/6_1e/3_2b` 补 `cp_stagecraft`；揭晓 `2_6/3_3/4_2a_g/5_2g/6_1e_g/6_3b_g` 均挂 `onEnter`；新增成就 `ACH_GRAMMY_SWEEP`(六 era 均≥1) / `ACH_GRAMMY_LEGEND`(累计≥18 或单张≥6)。验证：node --check 全过；定向测试全满贯企划→六 era 均 7–8 座、累计 46、两成就可达；零企划→0 座；smoke 400 局 0 异常/0 时间倒挂；en_smoke 200 局 0 残留；find_missing_en 0；repro 单文件 zh+en 14/18 结局。

### 17.15 续章 · 2019+ 舆论与法律延续（已落地 · 须遵循 §15.1）
> **背景（可考证的公开事实，仅作设计锚点，非游戏内定论）**：
> - 2019 年纪录片《Leaving Neverland》（HBO / Channel 4，导演 Dan Reed）上映，引发广泛公共讨论；片中讲述者为 Wade Robson 与 James Safechuck（二人早年与 MJ 相识）。
> - 2025–2026 年，Cascio 家族四名成年成员（Edward/Eddie、Dominic、Aldo Cascio 与妹妹 Marie-Nicole Porte）对 MJ 遗产委员会/相关公司提起新诉讼；遗产委员会律师 Marty Singer 以公开声明反驳，称其为「desperate money grab / shakedown attempt」，并称曾遭「以不公开换取金钱」的要挟，案件进入仲裁程序。（**经核实**：此四人均为早年与 MJ 亲近的「第二家庭」成员，且此前数十年曾公开为 MJ 辩护。）
> - **数额/时间线核实结论（2026-09-04 落地前核验）**：①「2020 年约 1600 万美元保密和解」属实（公开报道约 1650 万美元，约合每人 300 万）；②「2025 年付款后谈判破裂→诉讼」属实（遗产方 2025 年支付最后一笔约 250 万美元尾款后和解到期、对簿公堂）；③「2.13 亿美元敲诈」指向**另一独立案**——遗产方 2025 年对家族中另一成员 **Frank Cascio** 提起 2.13 亿美元敲诈诉讼并胜诉，与四名兄弟姐妹的诉讼是两件事，游戏内已分项陈述；④「被诱导成『士兵』为其辩护」对应原告方自身主张（称曾被「洗脑」为 MJ 辩护），属其单方陈述，游戏内仅以「争议性主张」呈现，不下定论。

> **设计约束（§15.1 中性化规范，硬性）**：
> 1. 仅以中性、程序化术语陈述可考证事实节点（纪录片上映 / 公共讨论 / 民事指控 / 诉讼 / 仲裁 / 庭外和解），**不描写任何行为细节**；
> 2. **不指名未成年当事人**，相关方以「早年相识者 / 相关家族成员」等程序化称谓指代；
> 3. **判断交还玩家**：MJ/遗产方如何应对由玩家选择驱动，游戏不为真实人物定罪；
> 4. **仅出现在 `survived2009` 续章线**（MJ 在世假设），与现有 `8_5b`「舆论风波」相邻；**不影响**主线 1993(`5_3`)/2002(`6_4`) 法律线。

#### 17.15.1 候选事件（续章，window 2019–2026）
| 候选 ID | 年 | 标题 | 史实锚点 | 玩法 / 维度 |
| --- | --- | --- | --- | --- |
| 8_5b（已充实） | 2019 | 《逃离梦幻岛》风波 | 原「舆论风波」点名《Leaving Neverland》，作为 2019 内容锚点（沿用既有三选：沉默 / 声明 / 慈善） | 影响 `media`/`loneliness`/`reputation` |
| 8_9 | 2025–2026 | 迟来的诉状 | Cascio 四名成年成员提起新诉讼；遗产委员会公开反驳（含 2020 和解与 2025 尾款后破裂；另述 Frank Cascio 2.13 亿敲诈案为独立事件） | 法律线延续：应诉 / 公开自证 / 和解 / 反诉 四选，影响 `wealth`/`media`/`reputation`/`stress` |

- **接入点（已落地）**：续章链 `8_5`（传记电影《Michael》）→ `8_9` → `8_7`（留给后人的话）；`8_5b` 已充实为《逃离梦幻岛》风波，并入既有 `8_5b` 不再单列 `8_8`。`8_9` 接在 `8_5` 与 `8_7` 之间，续章链 `8_5>8_9>8_7` 已验证可达（en_smoke 步数 15 途经 8_9，门禁 `check_epilogue_chain` 已将其纳入必经节点）。
- **新增 flag（已落地）**：`cascioSuit`（`litigate` 应诉 / `rebut` 公开自证 / `settle` 和解 / `counter` 反诉），记录玩家在虚构平行历史中的取舍；各选项含 `epilogue` 尾声文案，仅描述玩家路径后果，不评价真实人物。

#### 17.15.2 选项拓展（玩家多路径回应 · 「让 MJ 方有力回击」的机制化表达）
> 说明：用户要求「不能让卡西欧好过」。在 §15.1 框架内，本作以**赋予玩家充分、有力的回应选项**来实现这一诉求——即 MJ/遗产方在虚构续章线中拥有沉默、声明、慈善公益、依法应诉、公开历史材料等多元反制手段，而非由游戏对真实在世个人下定性结论。以下为选项 sketch：

**`8_8` 纪录片的回响（三选）**
- A 沉默，让作品说话 `{art+8, stress-5, loneliness+5}`：「不回应喧嚣，把注意力交还给音乐与舞台。」
- B 团队发声澄清 `{reputation-5, media+10, stress+8}`：「通过律师与团队发布声明，正面回应公共讨论。」
- C 以慈善与公益回应 `{reputation+10, phil+1, family+3}`：「把争议转化为善意——加码基金会与公益，用行动说话。」

**`8_9` 新的诉讼（三选 + 可选第四项）**
- A 依法应诉 / 推进仲裁 `{stress+15, wealth-15, media+10}`：「交由律师与仲裁程序，以事实与历史材料应对。」
- B 达成庭外和解 `{wealth-30, reputation-10}`：「以金钱换回平静，但舆论留下余波。」（呼应既有 `settlement*` 机制，flag 记录玩家取舍）
- C 公开历史材料自证 `{reputation+8, stress+10, media+8}`：「整理并公开历年证词与 cleared 记录，让公众自行判断。」
- D（可选）反诉 / 要求仲裁澄清 `{reputation+5, stress+12, wealth-10}`：「就『以不公开换取金钱』的要约启动反制法律程序。」

#### 17.15.3 合规红线（本作硬性约束 · 不可逾越）
- **不得**对真实在世个人作诽谤性定性（如断言其为「骗子 / 敲诈者 / 士兵」等）；遗产委员会「desperate money grab」等**仅可作为『被引述的公开声明』以程序化方式呈现（如选项或正文注明『据遗产方发言人称……』）**，游戏本身不下定论。
- **不得**渲染任何与未成年人相关的性描写或行为细节（§15.1：只写事实节点，不描写行为细节）。
- **不得**指名未成年当事人；相关方以程序化称谓指代。
- 收束文案（`END_TIMELESS_PRESENT` 分支）只描述「玩家路径导致的声誉/媒体后果」，不评价真实人物。

#### 17.15.4 验收与落地清单（已落地 g7）
- ✅ 在 `events.js` 追加 `8_9`（沿用 `T()` + EN 键，回退链兼容；`i18n_events_en.js` 补全全部 EN 文案，英文模式 0 残留）。
- ✅ `8_5` 三选项 `next` 由 `8_7` 改为 `8_9`，`8_9` 四选项 `next` 指向 `8_7`，接入 `survived2009` 续章链（与 `8_5b`《逃离梦幻岛》风波相邻，chronology 置于 2026 传记电影之后）。
- ✅ `8_5b` 标题/正文点名《Leaving Neverland》，落实 2019 纪录片内容（原 8_8 草案并入，不再单列）。
- ✅ 门禁：`en_smoke` 校验 8_9 EN 0 残留；`check_dup_events`/`check_variant_windows` 不受影响（非变体、无 `grammy_*`）；`check_epilogue_chain` 已将 `8_9` 纳入续章必经节点；`find_missing_en` = 0；`npm test` 全绿。
- ✅ 合规自查：新文案过 §15.1 红线（无未成年指名、无行为细节、无诽谤定性；遗产方「desperate money grab」仅作被引述公开声明；2.13 亿敲诈案明确为 Frank Cascio 独立事件）。

> **状态：✅ 已落地（g7）**。代码改动 `events.js` / `i18n_events_en.js` / `test/check_epilogue_chain.cjs`，未动 `config.js` 结局逻辑。

---



# 十八、附录

## 附录 A：节点统计（v0.5）
| 类型 | 数量 |
| --- | --- |
| 选择事件 | 约 48（含续章 12 个选择） |
| 自动事件 | 约 15（含续章 `8_7`） |
| 条件事件 | 约 18 |
| 变体事件 | 37（含续章 `V_POST_*` 3 个） |
| 结局/判定 | 15（18 结局 + 判定） |
| 合计 | 约 100+ |

## 附录 B：核心标志与元路线计数
**标志**：isSolo, soloAlbum1972, epicDeep, isPepsiBurned, painkillerDependent, weAreTheWorld, atvBought, captainEO, neverlandType, healWorld, marriedLisa, marriedDebbie, sonyMerge, invincibleStarted, bloodDance, scream, earthSong, ghosts, charity99, anniv2001, blanketBorn, babyDangle, bashirDoc, settlement1993, secondCharge, secondVerdict, debtCrisis, thisItHeld, thisItScale, digitalSingles, sonySold, biopic2026, biopicMJStar, survived2009, cascioSuit。
**元路线计数（非负整数）**：phil / mogul / recluse / artPath（隐藏，结局判定读取最高者）。

## 附录 C：结局情感矩阵
完美/希望、悲剧/悲伤、艺术巅峰/辉煌、家庭/温暖、财务/挫败、争议/压抑、生存负债/坚韧、平凡/平静、隐居/疏离、巨擘/冷峻、慈善/仁爱、永恒/崇敬、真·永恒/不朽至臻、续章/在场不朽。

## 附录 D：属性初值（见 5.2）
## 附录 E：生平锚点（见 4.5）

### 17.16 2026 春晚 · 假如 MJ 受邀（架空想象）✅已落地
> 用户 2026-09-04 提出：2026 年中国春晚，莱昂纳尔·里奇（Lionel Richie）与成龙合唱《We Are The World》，MJ 也受邀出席——此属「假如 MJ 2009 未离世」的续章架空事件，写入本规划（尚未实现）。
- **定位与合规**：属 §17.13「假如」时间线变体 / §17.8 C 续章 flavor；**仅出现在 `survived2009`（MJ 在世假设）续章线（ch5，2010–2026）**。严格遵守 §15.1：全文标注"（想象）"、中性、不诽谤在世真实个人、不渲染未成年细节；里奇/成龙仅作"被引述的公开合作"呈现，情感与判断交还玩家。
- **史实锚点（可考）**：Lionel Richie 为《We Are The World》（1985）词曲作者之一；本题设"2026 春晚里奇与成龙同台演唱该曲"为架空前提；MJ 已于 2009 年离世，故"MJ 受邀"纯属想象。
- **事件设计**：建议作为续章变体池新成员 `V_SFG_2026`（`variant:true`，窗口 2025–2026，`cond: survived2009`，低-中权重），不重写 `next` 链；或固定续章节点 `8_10`（年份 2026）。
- **触发**：`survived2009 === true` 且进入 ch5（续章 2025–2026 年主事件时，引擎按 `window:[2025,2026]` 概率插入；不另设 `phil/reputation` 门控——想象中"传奇"本就会被致敬）。实现为续章变体池首位（先于 V_POST_*），以获得合理触发率。
- **文本基调**：全球同唱《We Are The World》的温情"团圆"想象；MJ 作为"被致敬的传奇"受邀，以何种方式回应由玩家选择。
- **选项（三选，写入 flag + 轻量影响）**：
  - A：云端同台（全息/预录）— 与里奇、成龙隔空合唱《We Are The World》；`flag: sfgDuet=true`；`reputation+5, phil+1, rel:{fans:+8}`。
  - B：致辞致敬和平 — 发表"音乐无国界、童心即和平"简短致辞；`flag: sfgSpeech=true`；`reputation+3, stress-3`。
  - C：婉拒，守在家的炉火边 — 更想安静看直播；`flag: sfgDecline=true`；`family+5, stress-5`（呼应隐士/家庭线）。
- **结局联动（已落地）**：`sfgDuet && phil>=3` → 续章收束（8_7「留给后人的话」）追加"全球同唱"微分支 flavor；`sfgDecline && recluse>=1` → 同一 8_7 收束语追加"平和隐士"基调 flavor（注：`END_RECLUSE_SERENE` 属主线路死亡结局，survived2009 续章线不可达，故联动改注入 8_7 收束语，效果等价）。
- **EN 全量**：`event.V_SFG_2026.*`（或 `event.8_10.*`）入 `i18n_events_en.js`；标题/选项/提示中英齐全。
- **状态：✅ 已落地（g11，2026-09-04）**：实现为变体 `V_SFG_2026`（`variant:true, window:[2025,2026], weight:40, cond:survived2009`），插入于续章专属变体池首位（先于 V_POST_* 以获合理触发率）；三选项 A 云端同台 / B 致辞致敬 / C 婉拒，分别写入 `sfgDuet` / `sfgSpeech` / `sfgDecline` 标志；`__RETURN__` 回到主事件；联动注入 8_7 收束语；EN 全量（`event.V_SFG_2026.*` + `event.8_7.sfgDuet/sfgDecline.text`）。

---

*文档结束 — v1.6（续章 2010–2026 + 18 结局 + §17.3/§17.7/§17.8 拓展已落地；§17.15 续章·2019+ 舆论与法律延续已落地（8_5b 点名《逃离梦幻岛》+ 8_9 Cascio 2025–2026 诉讼，接入 8_5→8_9→8_7，EN 全量）；g9 批次：§17.4 深度游玩系统已落地、§17.6 剧情与文案拓展已落地（MJ 语录/歌词系统 + 结局注入）、§17.12 更多成就已落地（14 项，总 44，EN 全量）；g10 批次：游戏更名《月球漫步：传奇的抉择》/ Moonwalk: The Legend's Choice（原《迈克尔·杰克逊：人生选择》）、UI 响应式重构 + 6 章节差异化配色（§18）、§17.16 2026 春晚事件规划写入；本次 g11 批次：§17.16 2026 春晚事件已落地（变体 V_SFG_2026 + 8_7 收束联动 flavor + EN 全量）、主菜单重排（玩法简介 → 继续/新游戏 → 底部两行图鉴按钮 3+2，新增 .menu-grid 响应式）；§17.5 重复游玩增强无限期暂缓；其余 §17.10 仍为规划项）*
