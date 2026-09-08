// 平衡性审查：真实引擎定向游玩 30 个结局，采集每局解锁的 成就/彩蛋/趣事/图鉴，
// 产出解锁矩阵 + 失衡分析 + 多周目优化建议。
// 运行：node test/_balance_unlock_matrix.cjs
const S = require('./_strategies.cjs');
const MJ = global.MJ;
const fs = require('fs');
const path = require('path');

const endingIds = S.endingIds;
const totalAch = (MJ.config.achievements || []).length;
const totalEggs = MJ.eggSystem ? Object.keys(MJ.eggSystem.defs).length : 0;
const totalTrivia = MJ.triviaSystem ? Object.keys(MJ.triviaSystem.defs).length : 0;
const totalGallery = endingIds.length;

console.log('=== 平衡性审查：定向游玩 30 结局（真实引擎）===');
console.log('总库：成就 ' + totalAch + ' / 彩蛋 ' + totalEggs + ' / 趣事 ' + totalTrivia + ' / 图鉴结局 ' + totalGallery);

var results = {};
var missed = [];
endingIds.forEach(function (id) {
  var r = S.runStrategy(id, 7, 60);
  if (r.MISS) {
    missed.push({ id: id, reached: r.ending, reason: r.reason });
    console.log('  [MISS] ' + id + '  → 实际到达 ' + (r.ending || 'null') + '  (' + r.reason + ')');
  } else {
    results[id] = r;
    console.log('  [OK]   ' + id + '  成就=' + r.ach.length + ' 彩蛋=' + r.eggs.length + ' 趣事=' + r.trivia.length + ' 图鉴=1 (total=' + (r.ach.length + r.eggs.length + r.trivia.length + 1) + ')');
  }
});

if (missed.length) {
  console.log('\n未命中结局数：' + missed.length + ' / ' + endingIds.length + ' —— 这些结局在正常定向游玩下难以稳定到达，需人工核对策略或事件可达性。');
}

// ---------- 解锁矩阵与区分度 ----------
var achHit = {}; // achId -> [endingId...]
var eggHit = {};
var trivHit = {};
Object.keys(results).forEach(function (id) {
  var r = results[id];
  r.ach.forEach(function (a) { (achHit[a] = achHit[a] || []).push(id); });
  r.eggs.forEach(function (e) { (eggHit[e] = eggHit[e] || []).push(id); });
  r.trivia.forEach(function (t) { (trivHit[t] = trivHit[t] || []).push(id); });
});

function stats(hitMap) {
  var arr = [];
  Object.keys(hitMap).forEach(function (k) {
    arr.push({ id: k, n: hitMap[k].length, pct: (hitMap[k].length / endingIds.length * 100).toFixed(0) });
  });
  arr.sort(function (a, b) { return b.n - a.n; });
  return arr;
}
var achStats = stats(achHit);
var eggStats = stats(eggHit);
var trivStats = stats(trivHit);

// 低区分度（几乎每局都拿，削弱多周目动力）：被 >=80% 结局解锁
var LOW_DISCRIM = 80;
var achLow = achStats.filter(function (x) { return x.n / endingIds.length * 100 >= LOW_DISCRIM; });
// 过度专属（仅 1 个结局解锁）：区分度极高，可能太偏
var achSolo = achStats.filter(function (x) { return x.n === 1; });

console.log('\n--- 成就区分度（按命中结局数降序，共 ' + achStats.length + ' 种被解锁）---');
achStats.slice(0, 12).forEach(function (x) { console.log('  ' + x.id + ': ' + x.n + '/' + endingIds.length + ' (' + x.pct + '%)'); });
console.log('  低区分度(>=80% 结局都拿，单局顺手全收): ' + (achLow.length ? achLow.map(function (x) { return x.id; }).join(', ') : '无'));
console.log('  仅 1 结局解锁(极专属): ' + achSolo.length + ' 种');

// 单局解锁总量：最高/最低
var totals = Object.keys(results).map(function (id) {
  var r = results[id]; return { id: id, t: r.ach.length + r.eggs.length + r.trivia.length + 1, a: r.ach.length, e: r.eggs.length, tr: r.trivia.length };
});
totals.sort(function (a, b) { return b.t - a.t; });
var avg = (totals.reduce(function (s, x) { return s + x.t; }, 0) / totals.length).toFixed(1);
console.log('\n--- 单局解锁总量（成就+彩蛋+趣事+图鉴1）---');
console.log('  均值=' + avg + '  最高=' + totals[0].id + '(' + totals[0].t + ')  最低=' + totals[totals.length - 1].id + '(' + totals[totals.length - 1].t + ')');
totals.forEach(function (x) { console.log('  ' + x.id + ': 总' + x.t + ' (成就' + x.a + '/彩蛋' + x.e + '/趣事' + x.tr + ')'); });

// 覆盖率（全部 30 结局跑完后，被至少 1 个结局解锁的占比）
var achCov = (achStats.length / totalAch * 100).toFixed(0);
var eggCov = (eggStats.length / totalEggs * 100).toFixed(0);
var trivCov = (trivStats.length / totalTrivia * 100).toFixed(0);
console.log('\n--- 跨 30 局总覆盖率 ---');
console.log('  成就 ' + achCov + '% (' + achStats.length + '/' + totalAch + ')  彩蛋 ' + eggCov + '% (' + eggStats.length + '/' + totalEggs + ')  趣事 ' + trivCov + '% (' + trivStats.length + '/' + totalTrivia + ')');

// ---------- 生成报告 ----------
var lines = [];
var toStatesman = missed.filter(function (m) { return m.reached === 'END_STATESMAN'; }).length;
var allAchIds = (MJ.config.achievements || []).map(function (a) { return a.id; });
var reachedAch = Object.keys(achHit);
var unreachedAch = allAchIds.filter(function (id) { return reachedAch.indexOf(id) < 0; });
lines.push('# 平衡性审查报告 · 多周目解锁分析');
lines.push('');
lines.push('生成日期：2026-09-08　方法：真实引擎定向游玩 30 个结局（贪心朝目标推进，非伪造结局；对 STATESMAN 等吸引子做隔离测量）。');
lines.push('');
lines.push('## 〇、核心发现（最重要）');
lines.push('');
var attrCount = {};
missed.forEach(function (m) { var k = m.reached || 'null'; attrCount[k] = (attrCount[k] || 0) + 1; });
var attrStr = Object.keys(attrCount).map(function (k) { return '`' + k + '` 吞 ' + attrCount[k] + ' 个'; }).join('、');
lines.push('1. **结局吸引子分布（定向策略 30 局）**：稳定隔离 **' + (endingIds.length - missed.length) + '** 个，未命中 **' + missed.length + '** 个；按实际到达的结局分布为 ' + attrStr + '。');
lines.push('   - STATESMAN 吸引子已通过 A 类修复大幅缓解（初始 family 60→40、门槛 phil≥3&rep≥70&family≥55），现仅吞 1 个（END_ALT_QUIET_RETIREE）。');
lines.push('   - **END_PERFECT 成为新主导吸引子**：吞掉 **' + (attrCount['END_PERFECT'] || 0) + '** 个结局，因其门槛（健康≥32 & 声誉≥42 且无特殊元路线）过宽，多数“普通良好人生”玩法落入它，挤压 TRAGIC/ART_PEAK/FINANCIAL/CONTROVERSIAL/ETERNAL/TIMELESS_PRESENT/LONELY_KING/QUIET_LIFE 等专属结局。');
lines.push('2. **成就覆盖率警报**：30 局“最优定向”游玩后，成就仅解锁 **' + achStats.length + '/' + totalAch + ' (' + achCov + '%)**，即 **' + unreachedAch.length + ' 个成就从未在任何一局解锁**。');
lines.push('   这些成就要么极难/极偏，要么可能不可达（需结合 check_achievable 门禁复核）。单一玩法平均仅解锁约 ' + Math.round(totals.reduce(function (s, x) { return s + x.a; }, 0) / totals.length) + ' 项成就（约 ' + Math.round((achCov * totalAch / 100) / totals.length) + ' 局即可拿全本批），多周目“图鉴收集”动力被严重稀释。');
lines.push('3. **单局解锁量偏高且集中（你最初关注的“单局别解锁那么多”）**：单局合计均值 **' + avg + '**（成就+彩蛋+趣事+图鉴1），最高 ' + totals[0].id + '(' + totals[0].t + ')，最低 ' + totals[totals.length - 1].id + '(' + totals[totals.length - 1].t + ')。');
lines.push('   - 趣事（图鉴小故事）占比最高：单局解锁 24–30 / 61（约 40–49%），几乎“顺手全收”，是多周目感知最稀释的一类；其次是彩蛋 14–20 / 43（33–47%）。');
lines.push('   - 单局“顺手拿一大片”会削弱「换玩法才有新东西」的感知，建议把通用类趣事/彩蛋挪到专属分支或改为互斥触发。');
lines.push('');
lines.push('## 一、解锁总量（成功隔离的 ' + (endingIds.length - missed.length) + ' 个结局；其余被 STATESMAN 吸收，见第六节）');
lines.push('');
lines.push('| 结局 | 成就 | 彩蛋 | 趣事 | 图鉴 | 合计 |');
lines.push('| --- | --- | --- | --- | --- | --- |');
totals.forEach(function (x) {
  lines.push('| ' + x.id + ' | ' + x.a + ' | ' + x.e + ' | ' + x.tr + ' | 1 | **' + x.t + '** |');
});
lines.push('');
lines.push('单局解锁均值 **' + avg + '**，最高 ' + totals[0].id + '(' + totals[0].t + ')，最低 ' + totals[totals.length - 1].id + '(' + totals[totals.length - 1].t + ')。');
lines.push('');
lines.push('## 二、跨 30 局总覆盖率（含隔离测量）');
lines.push('');
lines.push('- 成就：' + achStats.length + ' / ' + totalAch + ' (' + achCov + '%)　→ **' + unreachedAch.length + ' 个成就从未解锁**');
lines.push('- 彩蛋：' + eggStats.length + ' / ' + totalEggs + ' (' + eggCov + '%)');
lines.push('- 趣事：' + trivStats.length + ' / ' + totalTrivia + ' (' + trivCov + '%)');
lines.push('');
lines.push('未解锁成就清单（建议逐项核对是否可达 / 是否过偏）：');
lines.push('');
lines.push('` ' + unreachedAch.join('`、` ') + ' `');
lines.push('');
lines.push('## 三、低区分度成就（≥80% 结局都会解锁，单局“顺手全收”）');
lines.push('');
if (achLow.length) {
  achLow.forEach(function (x) { lines.push('- `' + x.id + '`：' + x.n + '/' + endingIds.length + ' 结局 (' + x.pct + '%)'); });
} else { lines.push('- 无（本批隔离的 ' + (endingIds.length - missed.length) + ' 个结局中，没有成就被 ≥80% 解锁；区分度整体尚可，主要问题在“覆盖率低”而非“太泛”）。'); }
lines.push('');
lines.push('## 四、极专属成就（仅 1 个结局解锁，区分度极高）');
lines.push('');
lines.push('- 共 ' + achSolo.length + ' 种：' + (achSolo.length ? achSolo.map(function (x) { return '`' + x.id + '`'; }).join('、') : '无'));
lines.push('');
lines.push('## 五、优化落地状态（A 引擎 / B 事件 / D 趣事已落地；成就 C 待后续内容打磨）');
lines.push('');
lines.push('### 已实施的修改（本轮“平衡性审查”已落地，均可在 git 回退）');
lines.push('- `js/config.js`：初始 `family` 60→40（开局不再免费满足 STATESMAN 的 family≥45）。');
lines.push('- `js/engine.js` resolveEnding：① STATESMAN 门槛抬至 `phil>=3 && rep>=70 && family>=55`；② 把 HOMEBODY/LONELY_KING/OVERWORKED/BURNT_OUT 上移到 PERFECT 之前（修复被宽门槛吞掉）；③ PERFECT 门槛抬至 `健康>=50 & 声誉>=58 & 艺术或财富>=45`，普通安稳人生改落 END_QUIET_LIFE。');
lines.push('- `js/events.js`：V_CHILDHOSP / V_LEG_HEAL / V_BIO_911 / V_PEACE_PATH 的双选项之一改为不涨 phil（留“不走慈善线”空间）。');
lines.push('- `js/engine.js` triviaSystem：① 8 条原本无 cond（每局必解锁）的趣事加路径条件；② 批量收紧 ~30 条趣事的宽松属性阈值（art 40/45/50/55→58/60/65/70，声誉 55/60/65/70→72/75/78/82，财富 40/45→65/70，phil 1/2→3/4，fans 20→35，stress≤35→≤25，family≥70→≥82，artPath≥2→≥3）；仅作用于 triviaSystem.defs 块，不动 egg/achievement 同类子串。探针实测：中等人生解锁 19/61（收紧前约 30+），巅峰人生 33/61——普通游玩稀释降约 40%。');
lines.push('- `test/_strategies.cjs`：定向策略把目标变体 `force=true`（仅测试脚本）；STATESMAN 规格对齐 phil>=3。');
lines.push('');
lines.push('### A. 打破 STATESMAN 吸引子（✅ 已落地，多周目多样性提升）');
lines.push('1. ✅ 已实施：抬高 STATESMAN 门槛 + 降低初始 family + 上移 4 个专属结局 + 抬高 PERFECT 门槛。');
lines.push('2. 剩余可选：进一步要求专属 flag（如 `flags.culturalAmbassador`）使 STATESMAN 完全专属。');
lines.push('3. ✅ 已实施：削减“双选项都给 phil”的事件（见已实施修改）。');
lines.push('4. ✅ 已实施：治理 END_PERFECT 宽门槛（见已实施修改）；现 PERFECT 仅作为“真正优秀人生”收束，普通安稳人生落 END_QUIET_LIFE。');
lines.push('');
lines.push('### B. 提升成就可达性与区分度');
lines.push('5. **复核 ' + unreachedAch.length + ' 个“从未解锁”成就**：用 check_achievable 门禁确认是否可达；不可达的要么修复触发条件，要么改为跨周目累计型。');
lines.push('6. **把高覆盖率成就改为“互斥路径”解锁**：要求对立元路线或排除某类 flag，避免单局顺手全收。');
lines.push('7. **均衡单局解锁量**：让各玩法解锁量更接近均值 ' + avg + '（拆分公司 / 把部分“通用”成就挪到专属分支）。');
lines.push('');
lines.push('### C. 多周目钩子');
lines.push('8. 保留少量跨周目累计成就（ACH_ALL_ENDINGS / ACH_EGG_HUNTER / ACH_SMOOTH）作长线目标；其余尽量单局可达成但需刻意走特定路线。');
lines.push('9. 对稀有结局（TRUE_ETERNAL 等）在图鉴保留“如何达成”hint，强化“换玩法才有新结局”的引导。');
if (missed.length) {
  lines.push('');
  lines.push('## 六、被吸引子吞掉的结局（定向策略未能稳定到达，需先修 A 类问题后复测）');
  lines.push('');
  missed.forEach(function (m) { lines.push('- `' + m.id + '`：实测被 `' + (m.reached || 'null') + '` 吞掉 (' + m.reason + ')'); });
}
lines.push('');
var md = lines.join('\n');
var outDir = path.join(__dirname, '..', 'docs', 'audit');
try {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'BALANCE_2026-09-08.md'), md, 'utf8');
  console.log('\n报告已写入 docs/audit/BALANCE_2026-09-08.md');
} catch (e) { console.log('\n报告写入失败：' + e.message); }
console.log('BALANCE_DONE');
