// 结局「覆盖缺口」分析：找出没有对应结局、只能被兜底吞掉的状态原型，
// 以及被静默忽略的架空选择 / 无出口的属性轴。
// 运行：node test/_audit_endings_gaps.cjs [N]
global.window = global;
var fs = require('fs');
var path = require('path');
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
global.MJ = global.MJ || {};
var MJ = global.MJ;
MJ.t = function (k, v, fb) { return fb != null ? fb : k; };
require('../js/config.js');
require('../js/state.js');
require('../js/events.js');
require('../js/planner.js');
require('../js/engine.js');

MJ.localizeEvent = function (ev, state) {
  var st = state || (MJ.engine && MJ.engine.state) || {};
  var copy = Object.assign({}, ev);
  if (typeof copy.options === 'function') copy.options = copy.options(st);
  if (typeof copy.text === 'function') copy.text = copy.text(st);
  return copy;
};
MJ.ui = {
  showEvent: function () {}, showEraCard: function (c, s, cb) { cb(); },
  showEnding: function () {}, toastEgg: function () {}, toastTrivia: function () {}, showModal: function () {}
};
var resolvedEndingId = null;
MJ.engine.showEnding = function (entryId) { resolvedEndingId = MJ.resolveEnding(this.state, entryId); };

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function runPlaythrough(seed) {
  var rng = mulberry32(seed);
  Math.random = rng;
  MJ.engine.start();
  resolvedEndingId = null;
  var guard = 0;
  while (guard++ < 4000) {
    if (resolvedEndingId) break;
    var ev = MJ.engine.current;
    if (!ev) break;
    var opts = MJ.engine.optionsOf(ev);
    if (!opts || !opts.length) { MJ.engine.proceed(); continue; }
    MJ.engine.choose(Math.floor(rng() * opts.length) % opts.length);
  }
  var st = MJ.engine.state;
  return {
    ending: resolvedEndingId,
    health: st.attributes.health, reputation: st.attributes.reputation, art: st.attributes.art,
    wealth: st.attributes.wealth, family: st.attributes.family, stress: st.attributes.stress,
    media: st.attributes.media || 0, loneliness: st.attributes.loneliness || 0,
    netWorth: st.netWorth, debt: st.debt,
    meta: Object.assign({}, st.meta), flags: Object.assign({}, st.flags),
    timeline: Object.assign({}, st.timeline || {}), dom: MJ.dominantMeta(st.meta)
  };
}
// 复刻 resolveAltEnding（架空时间线本应导向的结局）
function wantAlt(st) {
  var tl = st.timeline || {};
  if (tl['1975'] === 'motown') return 'END_ALT_STAY_MOTOWN';
  if (tl['1979'] === 'solo_prod') return 'END_ALT_NO_QJ';
  if (tl['1984'] === 'safe') return 'END_ALT_HEALED';
  if (tl['biz'] === 'empire') return 'END_ALT_MEDIA_MOGUL';
  if (st.flags.altPeace === true) return 'END_ALT_PEACE_LAUREATE';
  if (st.flags.altQuietRetiree === true) return 'END_ALT_QUIET_RETIREE';
  return null;
}
function band(v, cuts, labels) {
  for (var i = 0; i < cuts.length; i++) if (v < cuts[i]) return labels[i];
  return labels[labels.length - 1];
}
function sig(r) {
  return [
    '健康' + band(r.health, [25, 45, 70], ['极低', '低', '中', '高']),
    '声誉' + band(r.reputation, [42, 60, 80], ['低', '中', '高', '极高']),
    '艺术' + band(r.art, [45, 70], ['低', '中', '高']),
    (r.debt ? '负债' : (r.wealth >= 60 ? '富' : '平常')),
    '路线' + (r.dom || '无'),
    (r.flags.isPepsiBurned ? '已烧伤' : '未烧伤')
  ].join(' / ');
}

var N = Number(process.argv[2] || 8000);
var sigMap = {};      // 原型 -> {total, endings:{}, fallback:0}
var altSwallow = {};  // 架空选择对结局完全无体现 -> count
var altSwallowTotal = 0;
var altCovered = 0;   // 被续章专属 alt 结局覆盖（合理）
var altOther = 0;     // 落到另一个 alt 结局
var axis = {
  stressHigh: { n: 0, endings: {} }, lonelyHigh: { n: 0, endings: {} },
  familyHighSolo: { n: 0, endings: {} }, artHighRepLow: { n: 0, endings: {} },
  healthLowRepHigh: { n: 0, endings: {} }, peaceNoCharge: { n: 0, endings: {} }
};
function bumpEndings(o, id) { o[id] = (o[id] || 0) + 1; }

for (var i = 0; i < N; i++) {
  var r = runPlaythrough(500000 + i);
  if (!r.ending) continue;
  var f = r.flags;
  // 兜底判定：无烧伤无依赖的 TRAGIC（无门槛兜底）、续章兜底 TIMELESS_PRESENT
  var isFallback = false;
  if (r.ending === 'END_TRAGIC' && !f.isPepsiBurned && !f.painkillerDependent) isFallback = true;
  else if (r.ending === 'END_TIMELESS_PRESENT') isFallback = true;

  var s = sigMap[sig(r)];
  if (!s) s = sigMap[sig(r)] = { total: 0, endings: {}, fallback: 0 };
  s.total++;
  bumpEndings(s.endings, r.ending);
  if (isFallback) s.fallback++;

  // 架空选择被续章分支吞掉（区分：被续章专属 alt 覆盖=合理 / 完全无体现=缺口）
  var wa = wantAlt(r);
  // 与 resolveEnding 续章分支守卫一致：已烧伤的玩家即便做了「稳妥康复」分叉，
  // 也不应计入"被吞掉"——引擎本就返回 null 让其落中性收束，属有意拦截而非缺口。
  if (wa === 'END_ALT_HEALED' && f.isPepsiBurned) wa = null;
  if (f.survived2009 === true && wa) {
    if (r.ending === 'END_ALT_SURVIVE_LEGACY') altCovered++;
    else if (r.ending.indexOf('END_ALT_') === 0) altOther++;
    else { altSwallow[wa] = (altSwallow[wa] || 0) + 1; altSwallowTotal++; }
  }
  // 无出口的属性轴
  if ((r.stress || 0) >= 70) { axis.stressHigh.n++; bumpEndings(axis.stressHigh.endings, r.ending); }
  if ((r.loneliness || 0) >= 70) { axis.lonelyHigh.n++; bumpEndings(axis.lonelyHigh.endings, r.ending); }
  if ((r.family || 0) >= 70 && f.isSolo === true) { axis.familyHighSolo.n++; bumpEndings(axis.familyHighSolo.endings, r.ending); }
  if ((r.art || 0) >= 70 && (r.reputation || 0) < 42) { axis.artHighRepLow.n++; bumpEndings(axis.artHighRepLow.endings, r.ending); }
  if ((r.health || 0) < 45 && (r.reputation || 0) >= 80 && !f.isPepsiBurned) { axis.healthLowRepHigh.n++; bumpEndings(axis.healthLowRepHigh.endings, r.ending); }
  if ((r.meta.phil || 0) >= 3 && !(f.settlement1993 || f.secondCharge) && r.dom !== 'phil') { axis.peaceNoCharge.n++; bumpEndings(axis.peaceNoCharge.endings, r.ending); }
}

function top(o, k) {
  var arr = Object.keys(o).map(function (x) { return [x, o[x]]; });
  arr.sort(function (a, b) { return b[1] - a[1]; });
  return arr.slice(0, k).map(function (x) { return x[0] + '×' + x[1]; }).join(', ');
}
var L = [];
L.push('结局「覆盖缺口」分析  N=' + N + '（真实引擎 + 变体注入）');
L.push('');
L.push('=== 一、被兜底吞掉的状态原型（缺口候选：无专属结局，落入默认） ===');
var sigs = Object.keys(sigMap).filter(function (k) { return sigMap[k].fallback > 0; });
sigs.sort(function (a, b) { return sigMap[b].fallback - sigMap[a].fallback; });
if (!sigs.length) L.push('  无。');
sigs.forEach(function (k) {
  var s = sigMap[k];
  L.push('  [' + k + ']  共 ' + s.total + ' 局，其中兜底 ' + s.fallback + ' 局（' + (s.fallback / s.total * 100).toFixed(0) + '%）');
  L.push('      实际去向：' + top(s.endings, 5));
});
L.push('');
L.push('=== 二、兜底率最高的原型（不论是否有兜底，看结局是否“专属于该原型”） ===');
var all = Object.keys(sigMap);
all.sort(function (a, b) { return sigMap[b].total - sigMap[a].total; });
all.slice(0, 12).forEach(function (k) {
  var s = sigMap[k];
  L.push('  ' + k + '  ' + s.total + ' 局 → ' + top(s.endings, 4));
});
L.push('');
L.push('=== 三、架空选择被续章分支静默吞掉（玩家选了分叉，结局却无体现） ===');
L.push('  续章局且做过架空分叉的样本中：');
L.push('    被续章专属 alt 覆盖（合理）      ' + altCovered + ' 次');
L.push('    落到另一个 alt 结局（可接受）    ' + altOther + ' 次');
L.push('    ★ 架空选择对结局完全无体现（缺口）' + altSwallowTotal + ' 次');
Object.keys(altSwallow).sort(function (a, b) { return altSwallow[b] - altSwallow[a]; }).forEach(function (k) {
  L.push('      ' + k + ' 被吞掉 ' + altSwallow[k] + ' 次');
});
if (!altSwallowTotal) L.push('    无。');
L.push('');
L.push('=== 四、属性轴“无出口”检查（这些状态有大量玩家，却没有专属结局） ===');
Object.keys(axis).forEach(function (k) {
  var a = axis[k];
  L.push('  ' + k + '：' + a.n + ' 局 → ' + (a.n ? top(a.endings, 5) : '—'));
});

var outPath = path.join(__dirname, '..', '.codebuddy', 'endings_gaps.txt');
fs.writeFileSync(outPath, L.join('\n'), 'utf8');
console.log('WROTE ' + outPath);
console.log('FALLBACK_SIGS=' + sigs.length + ' ALT_SWALLOW=' + altSwallowTotal);

// ---------- 回归门禁判定（供 npm test 接⼊） ----------
// ALT_SWALLOW>0 表示玩家做过的架空分叉在续章里被静默吞掉（覆盖缺口重开）。
// 注：FALLBACK_SIGS 含合法的续章兜底 END_TIMELESS_PRESENT，不作失败门禁。
var failed = altSwallowTotal > 0;
if (failed) {
  console.error('FAIL 架空选择覆盖缺口：ALT_SWALLOW=' + altSwallowTotal + '（详见 ' + outPath + '）');
  process.exit(1);
}
console.error('PASS 架空选择覆盖：ALT_SWALLOW=0（续章尊重 BP 分叉）');
