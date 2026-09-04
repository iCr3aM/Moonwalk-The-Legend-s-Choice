# 游戏设计文档（GDD）
## 《迈克尔·杰克逊：人生选择》 Michael Jackson: Life Choices

> 文档修订说明（v0.6 · 敏感内容中性化）：
> - 在 v0.5 基础上**对敏感法律事件做中性化改写**：以程序性/法律术语（民事指控、刑事指控、逮捕程序、庭审结果、庭外和解、裁定无罪）替代定性表述，只对可考证的史实节点叙述，不预设有罪/无罪，判断交由玩家选择驱动（详见第十五章「内容中性化规范」）。
> - 此前 v0.5 已深度拓展：生平年表更细（新增 1964 组队、1969 Ed Sullivan、1976 CBS、1984 Victory 巡演、1988 Moonwalker、1993 Oprah 访谈、1995 Scream、1996 争议单曲、1997 Ghosts、1999 慈善演唱会、2001 30 周年、2003 Number Ones/被捕、2008 Thriller 25 等）。
> - **选项深化**：多数关键事件改为「三选」，引入权衡更尖锐的第三选项。
> - **新增「可能性系统 / 变体事件」**：随周目以概率插入的随机事件，保证每次游玩体验不同。
> - **新增四条元路线**：艺术家 / 慈善家 / 商业巨擘 / 隐士，由累积选择决定走向，解锁专属事件与结局。
> - **结局由 8 种扩充到 12 种**，新增隐居隐士、慈善圣人、商业巨擘、永恒符号等。
> - 技术架构详见 `架构设计.md`。

---

## 文档信息

| 项目 | 内容 |
| --- | --- |
| 文档版本 | 0.6（敏感内容中性化 + 选项/分支/变体系统/元路线/12 结局） |
| 游戏名称 | 《迈克尔·杰克逊：人生选择》 |
| 英文名称 | Michael Jackson: Life Choices |
| 别名 | 《月球漫步：传奇的抉择》 / Moonwalk: The Legend's Choice |
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
13 种结局（含 1 隐藏终极），标志优先 + 属性阈值 + 元路线（见第七章）。
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
12 结局 + 变体事件 + 元路线 + 隐藏/条件事件 + 速通（1969 留盖瑞）+ 关键选择回顾。

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
| 七、告别与归宿 | 2006–2009 | 7_0,7_1,7_2,7_3 + 12 结局 |

> 含变体事件与判定，总节点约 **85+**，达成设计目标 50–70+ 的饱和态。

## 6.2 叙事节奏
前两章轻快；第三章巅峰+伏笔；第四章中场；第五、六章密集冲突；第七章收束试炼。变体事件在冲突期插入，增强不确定性。

## 6.3 关键事件链
- 单飞线：1_5→1_6→2_4→Thriller/Bad 收益→索尼合并→艺术/历史结局。
- 健康线：3_2 百事→3_4 依赖→5_4 成瘾→存活/悲剧。
- 法律线：4_1 庄园→5_3(1993 民事指控)→6_4(2002 刑事指控)→6_5 庭审结果。
- 慈善线：3_5→5_2b→6_2e→philPath→慈善圣人结局。
- 商业线：3_6(ATV)→6_1b(索尼)→追加收购→mogulPath→商业巨擘结局。
- 隐士线：5_2d 拒访→6_4d 拒拍→reclusePath→隐居隐士结局。

## 6.4 完整事件节点目录（v0.5 · 含三选与新增）
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
| 1_6 | 1972 | 早期个人专辑 | 条件(仅单飞) | A [soloAlbum1972=true] {art+15,wealth+10,family-5} / B [soloAlbum1972=false] {family+5,art+5} | 2_1 |
| 1_7 | 1972 | 《Ben》奥斯卡提名 | 选择 | A 出席 {rep+5,stress+5} / B 专注录音室 {art+5} / C 携宠物鼠营销 {rep+5,family+5} | 2_1 |
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
| 3_3 | 1984 | 格莱美 8 项 | 自动(随 isSolo) | 单飞 {art+20,rep+20} / 非 {art+8,rep+8} | 3_4 |
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
| 4_3 | 1988 | 自传《月球漫步》 | 自动 | {rep+10,wealth+5} | 5_1 |

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

---

# 七、结局设计

## 7.1 结局列表（13 种，含 1 隐藏终极）
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

## 7.2 结局判定逻辑（优先级规则表）
```
1. END_PLAIN          若 entryId==END_PLAIN（1_5 留盖瑞早退）
2. END_FAMILY         若 isSolo===false
3. END_TRUE_ETERNAL   若 !isPepsiBurned && !debt && art>=88 && rep>=88 && health>=80 && phil>=3 && artPath>=2 && (thriller25 && anniv2001)  【隐藏终极：多方极致收敛 + 双加冕】
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

## 8.2 十二结局可达性矩阵
| 结局 | 关键门槛 | 玩家路径 |
| --- | --- | --- |
| END_PLAIN | 1969 留盖瑞 | 非巨星线 |
| END_FAMILY | isSolo=false | 始终兄弟 |
| END_RECLUSE | recluse 最高 & health≥45 | 多次拒访/拒拍/隐居 |
| END_MOGUL | mogul≥2 & !debt & wealth≥60 | ATV+索尼+追加收购 |
| END_PHILANTHROPIST | phil≥3 & !debt | We Are The World+Heal+1999 慈善 |
| END_ETERNAL | !burned & art≥75 & rep≥65 & health≥55 & (thriller25∥anniv2001) | 拒百事+艺术满投入+控压+加冕标志 |
| END_PERFECT | !burned & health≥50 & rep≥60 | 拒百事+健康声誉稳健 |
| END_TRUE_ETERNAL | !burned & !debt & art≥88 & rep≥88 & health≥80 & phil≥3 & artPath≥2 & (thriller25&&anniv2001) | 四方极致+双加冕（**隐藏终极**） |
| END_ART_PEAK | burned & !dep & held & full | 烧伤戒药+满规模 |
| END_TRAGIC | burned & dep & held & full | 历史复刻 |
| END_FINANCIAL | debt===true | 购庄园+巨和解+成本 |
| END_CONTROVERSIAL | rep<30 & settlement1993 | 1993 和解+声誉崩 |
| END_SURVIVE_DEBT | !held & debt | 取消巡演保命负债 |

## 8.3 平衡校验
- **优先级唯一**：1→13 顺序保证不重叠。
- **元路线破平**：艺术>慈善>商业>隐士，避免歧义。
- **可达保障**：Economy 修正后财务/争议/生存可达；元路线由累积计数解锁，非互斥过强。
- **数值 sanity**：非单飞艺术封顶约 60，天然限制艺术/永恒类仅单飞可达；元路线需多事件累积，防止"一键触发"。

---

# 九、UI / UX（同 v0.3/v0.4：四区布局、hint 预览、响应式、无时间压力）
新增：元路线进度可在属性面板下方以小型"人生轨迹"标签暗示（如"艺术家倾向↑"），增强反馈。

---

# 十、美术与听觉（同前：暗金复古、符号化、原创/公共领域 BGM）

---

# 十一、技术架构
详见 `架构设计.md`：数据驱动分层、JSON 事件 schema（含 `variant`/`weight` 支持变体事件、`metaPath` 标记）、OutcomeResolver 规则表、Economy 双轨数值、RuleEngine、SaveSystem、I18n、Vitest、Vite 单文件构建。

---

# 十二、新手引导 / 十三、本地化 / 十四、数据埋点
（规划同前；埋点新增：变体事件触发率、元路线分布、12 结局分布、三选占比。）

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
5. **v0.5 新增**：原 8 结局偏窄 → 扩至 12 并引入元路线/变体事件，需保证判定优先级无冲突（已由 7.2 规则表约束）。

---

# 十七、后续扩展
> 实现状态（截至代码侧多轮迭代）：成就（✓ 15 项）、关键选择回顾（✓）、社交分享（✓ 传奇海报：Canvas 图片 + 保存/复制/分享图片 + 引导页文字分享）、被搁置彩蛋 chinaVisit 访华（✓ 隐藏变体）、变体事件池（✓ 34 个，含 5 个稀有门控隐藏/条件变体）、元路线倾向反馈（✓ §9）、生涯数据深度（✓ 节点/变体/关键抉择计数）、环境音（✓ §10 WebAudio 开关）。**功能性扩展大多已落地；余下「多语言 i18n」待规划，且仍有大量「体验深化（代入感与故事性）」候选，见 §17.1。**

- 多语言 i18n（待规划）
- 成就（慈善家/巡演王/法律斗士/隐士，✓ 已扩至 15 项）
- 关键选择回顾（✓）
- 社交分享（✓ 已升级为「传奇海报」：Canvas 生成可保存 PNG，支持保存/复制文案/移动端分享图片；引导页保留文字分享）
- 被搁置彩蛋（chinaVisit 访华，✓ 已实现为隐藏变体）
- 变体事件池（✓ 已达 34 个，含 5 个稀有门控隐藏/条件变体）

### 17.1 体验深化路线（代入感与故事性）★已落地（2026-09-04，M1–M8 全部实现）
> 目标：在已搭好的"数据驱动 + 元路线 + 变体 + 12 结局 + 海报"骨架上，补上**情感与叙事血肉**，强化"蝴蝶效应"（§2.2）与"历史尊重/情感真实"（§15）。按性价比分三档；每个模块若实现，建议在 GDD 中新增对应小节（如 §5.8/§5.9/§6.2 强化）。

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
- **M10 多周目传承（NG+）**：解锁"导演评论/幕后花絮"模式，或"传奇等级"解锁限定变体，强化重玩性。
- **M11 成就叙事化**：部分成就解锁专属幕后片段（如"月球漫步诞生"花絮），让成就成为故事节拍。
- **M12 关键抉择回放时间轴**：结局页"人生回放"带年份标记与"假如当初…"提示，呼应 §5.7 重玩性。

---

# 十八、附录

## 附录 A：节点统计（v0.5）
| 类型 | 数量 |
| --- | --- |
| 选择事件 | 约 34 |
| 自动事件 | 约 14 |
| 条件事件 | 约 18 |
| 变体事件 | 34（已扩，含隐藏/条件） |
| 结局/判定 | 14（13 结局 + 判定） |
| 合计 | 约 85+ |

## 附录 B：核心标志与元路线计数
**标志**：isSolo, soloAlbum1972, epicDeep, isPepsiBurned, painkillerDependent, weAreTheWorld, atvBought, captainEO, neverlandType, healWorld, marriedLisa, marriedDebbie, sonyMerge, invincibleStarted, bloodDance, scream, earthSong, ghosts, charity99, anniv2001, blanketBorn, babyDangle, bashirDoc, settlement1993, secondCharge, secondVerdict, debtCrisis, thisItHeld, thisItScale。
**元路线计数（非负整数）**：phil / mogul / recluse / artPath（隐藏，结局判定读取最高者）。

## 附录 C：结局情感矩阵
完美/希望、悲剧/悲伤、艺术巅峰/辉煌、家庭/温暖、财务/挫败、争议/压抑、生存负债/坚韧、平凡/平静、隐居/疏离、巨擘/冷峻、慈善/仁爱、永恒/崇敬、真·永恒/不朽至臻。

## 附录 D：属性初值（见 5.2）
## 附录 E：生平锚点（见 4.5）

---

*文档结束 — v0.6（敏感中性化 + v0.5 深度拓展；§17 多数扩展已落地，并规划「体验深化路线」见 §17.1）*
