<p align="center">
  <a href="./README.md"><strong>🇨🇳 中文</strong></a>
  &nbsp;·&nbsp;
  <a href="./README_EN.md">🇺🇸 English</a>
</p>

# 月球漫步：传奇的抉择 · Moonwalk: The Legend's Choice

> 一款**数据驱动的文字人生模拟游戏**：你扮演迈克尔·杰克逊，从 1958 年到 2009 年走过一个个关键抉择；并可在 2009 年选择「续写人生」，进入假设其并未离世的 2010–2026 篇章。

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://www.ecma-international.org/)
[![Vanilla JS](https://img.shields.io/badge/UI-Vanilla%20JS-2ea44f?style=flat-square)](https://developer.mozilla.org/)
[![Design](https://img.shields.io/badge/design-GDD%20v1.13-8A2BE2?style=flat-square)](./GDD.md)
[![No Build](https://img.shields.io/badge/build-none%20required-00b4d8?style=flat-square)](./index.html)
[![License](https://img.shields.io/badge/license-Unspecified-red?style=flat-square)](#许可证)

---

## 📑 目录

- [特性](#-特性)
- [快速开始](#-快速开始)
- [玩法简介](#-玩法简介)
- [目录结构](#-目录结构)
- [测试](#-测试)
- [设计约束](#-设计约束)
- [许可证](#-许可证)

---

## ✨ 特性

- **严格对齐设计文档**：所有玩法、分支、数值、结局均依据 [`GDD.md`](./GDD.md)（v1.13）实现。
- **六维属性 + Economy 双轨**：健康 / 声誉 / 财富 / 家庭 / 艺术 / 压力（均 0–100）；大额金钱走 `netWorth` / `debt`（万元），修复早期「财富被 clamp 到 0」导致结局不可达的 bug。
- **30 种结局（23 主线 + 7 假设线）**：含 1 个隐藏终极结局（真·永恒）与 7 个假设线（架空历史）结局，由优先级规则表 + 元路线破平次序解析。
- **四条隐藏元路线**：艺术家 / 慈善家 / 商业巨擘 / 隐士，由选择累积、实时提示「正在走向 X 之路」。
- **变体事件系统（可能性系统）**：81 变体按「概率 + 年份窗口」在章节间插入，含稀有门控的隐藏 / 条件变体。
- **70 项成就**：复用图鉴式 `localStorage` 持久化，游戏中实时弹窗解锁。
- **双语支持（简体中文 / English）**：可一键切换语言，事件文案全量本地化。
- **续章「假设 MJ 未离世」（2010–2026）**：This Is It 驻演、数字单曲计划、2016 索尼收购 Sony/ATV 半数股权、2026 传记片《Michael》等史实锚点。
- **传奇海报**：结局页自动用 Canvas 生成可保存（长按）的图片海报（六维数值、主导路线、节点 / 变体 / 抉择统计、成就进度）。
- **关键抉择回顾 + 隐藏彩蛋**：结局页回顾面板 + 低概率隐藏彩蛋（15 枚）。
- **自动续玩**：`localStorage` 自动存档（含当前节点 id），刷新即可继续。
- **中性、程序化叙述**：敏感法律事件采用事实化表述，不预设有罪 / 无罪，不指名未成年当事人。
- **响应式暗金复古界面**：CSS Grid 四区布局，移动端两列、桌面三列自适应。

---

## 🚀 快速开始

### 方式一：直接打开（推荐）
直接用浏览器打开 [`index.html`](./index.html) 即可游玩（采用经典脚本加载，**无需构建工具、无需本地服务器**）。

### 方式二：本地静态服务器
若浏览器对 `file://` 下的 `localStorage` 有限制，可用任意静态服务器：

```bash
python -m http.server 8000
# 然后访问 http://localhost:8000
```

### 可选：单文件构建（便于部署）
源码保持「经典脚本 + 双击即运行」不变；如需一个零依赖、便于分发的单文件产物，用内置脚本即可（无需安装任何依赖）：

```bash
node build_singlefile.cjs   # 等价于 npm run build，产出 dist/index.html 单一文件（JS/CSS 全部内联）
```

`dist/index.html` 已内联全部脚本与样式，**双击即可运行**，可直接托管到任意静态空间。

---

## 🧩 玩法简介

1. **引导页**：查看操作说明，选择是否从存档继续，可切换语言。
2. **状态栏**：实时显示六维属性、净资产、主导元路线与「当前年份 / 人生轨迹」。
3. **事件卡**：每个历史节点给出 2–3 个选项，选项带有 `hint` 预览潜在影响（属性 / 金钱 / 标志）。
4. **变体事件**：在主线之外，按概率与年代窗口插入的「可能性」事件，丰富时代纹理。
5. **结局**：依据属性、标志与元路线，由规则表解析出 30 种结局之一；续章线永不归死亡结局。
6. **结局页**：展示传奇海报、关键抉择回顾、生涯数据统计与成就解锁。

---

## 🗂 目录结构

```
index.html                入口，按依赖顺序加载脚本
css/style.css             暗金复古主题、四区布局、响应式
js/config.js              全局配置：初始属性 / 标志 / 元路线 / 结局定义
js/i18n.js                国际化框架（语言切换 / 文案字典）
js/i18n_events_en.js      事件英文本地化字典
js/events.js              事件数据（数据驱动，对齐 GDD 6.4 全部节点 + 变体事件）
js/state.js               游戏状态 + Economy 子系统（净资产 / 债务双轨）
js/engine.js              规则引擎 / 效应应用 / 结局解析 / 事件流 / 变体插入 / 存档
js/ui.js                  视图与用户流程（引导 / 状态栏 / 事件卡 / 结局）
GDD.md                    游戏设计文档（权威规范）
test/smoke.cjs            Node 无 DOM 冒烟 + 平衡测试（随机 400 局 + 时间线单调回归断言）
test/en_smoke.cjs         英文文案 / 续章链路 / 新事件覆盖测试
```

> ⚠️ 根目录下的 `check_keys.cjs`、`debug_events.cjs`、`event_keys.txt`、`js/events.wrapped.js`、`wrap_events.cjs` 为开发 / 调试脚手架，**已加入 `.gitignore`，不纳入版本管理**。

---

## ✅ 测试

项目以 **Node 无 DOM 冒烟测试** 驱动引擎，验证「随机多局 0 异常且必到结局」以及「时间线显示年份单调非递减（无倒挂）」：

```bash
npm test                  # 运行全部 13 项回归门禁（推荐）
node test/smoke.cjs        # 随机 400 局 + 时间倒挂回归断言（倒挂将非零退出）
node test/en_smoke.cjs     # 英文文案 / 续章链路 / 第二章 solo 链路 / 新事件覆盖
```

---

## 📐 设计约束

- 一切以 [`GDD.md`](./GDD.md) 为权威设计规范；文档与实现冲突时以 GDD 为准并在文档标注。
- 敏感法律事件必须**中性、程序化**表述，不预设有罪 / 无罪，避免指名未成年当事人。
- 旧版单文件 HTML 原型已归档至 `archive/`，不在本仓库继续维护。

---

## 📄 许可证

本项目目前**未包含明确开源许可证**（保留所有权利）。如需使用、修改或分发，请先联系作者。

---

<p align="center">为流行之王而作 · 「若想让世界更美好，先审视自己，然后做出改变。」</p>
<p align="center"><i>"If you want to make the world a better place, take a look at yourself, and then make a change."</i></p>
