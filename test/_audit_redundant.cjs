// 冗余选项审计：检测"无论选哪个都差不多"的事件（效果+flags+next 全相同）→ 候选删减/合并
// 同时统计选项数 <2 的事件（规范：选项应 ≥2，理想 3+）
global.window = global;
try { require('../js/events.js'); } catch (e) { console.error('load events failed', e); process.exit(1); }
var E = global.MJ.EVENTS;
if (!E) { console.error('MJ.EVENTS missing'); process.exit(1); }

var SAMPLE = { flags: {}, timeline: {}, attrs: {} };

function optsOf(ev) {
  try {
    if (typeof ev.options === 'function') return ev.options(SAMPLE);
    return ev.options || [];
  } catch (e) { return null; } // 动态选项解析失败
}

function sig(o) {
  // 效果+flags+next+outcome 决定"选了之后发生什么"
  function clean(v) {
    if (v && typeof v === 'object') {
      var out = {};
      Object.keys(v).sort().forEach(function (k) { out[k] = clean(v[k]); });
      return out;
    }
    if (Array.isArray(v)) return v.map(clean);
    return v;
  }
  return JSON.stringify({
    effects: clean(o.effects || {}),
    flags: clean(o.flags || {}),
    next: o.next != null ? o.next : null,
    outcome: o.outcome != null ? o.outcome : null
  });
}

var total = 0, choiceCount = 0, less2 = [], redundant = [], noStatDiff = [], dynamicFail = [];
var labels = {}; // 收集标签重复

Object.keys(E).forEach(function (id) {
  var ev = E[id];
  if (!ev || ev.kind !== 'choice') return;
  if (ev.variant) return; // 变体事件不在本次"主线选项"审计范围
  total++;
  var opts = optsOf(ev);
  if (opts === null) { dynamicFail.push(id); return; }
  choiceCount++;
  if (opts.length < 2) { less2.push(id + ' (opts=' + opts.length + ')'); return; }
  var sigs = opts.map(sig);
  var allSame = sigs.every(function (s) { return s === sigs[0]; });
  if (allSame) {
    redundant.push({
      id: id,
      year: ev.year,
      title: (ev.title && (ev.title.zh || ev.title)) || ev.id,
      opts: opts.length,
      sampleLabel: (opts[0].label || '').slice(0, 24),
      labels: opts.map(function (o) { return (o.label || '').slice(0, 30); })
    });
    return;
  }
  // 效果相同但 next/flags 不同 → 仍有分支，但无数值差异，供审阅
  var effSigs = opts.map(function (o) { return JSON.stringify(cleanEff(o.effects || {})); });
  function cleanEff(v){var out={};if(v&&typeof v==='object'){Object.keys(v).sort().forEach(function(k){out[k]=v[k];});}return out;}
  if (effSigs.every(function (s) { return s === effSigs[0]; })) {
    noStatDiff.push({ id: id, year: ev.year, opts: opts.length });
  }
});

console.log('=== 冗余选项审计 ===');
console.log('choice(主线)事件总数:', total, ' 可解析:', choiceCount);
console.log('选项<2 的事件 (' + less2.length + '):');
less2.forEach(function (x) { console.log('  - ' + x); });
console.log('效果+flags+next 全相同的"伪选择" (' + redundant.length + '):');
redundant.forEach(function (r) {
  console.log('  - ' + r.id + ' [' + r.year + '] "' + r.title + '"  opts=' + r.opts);
  console.log('      标签: ' + JSON.stringify(r.labels));
});
console.log('仅无数值差异(但有分支) (' + noStatDiff.length + '):');
noStatDiff.forEach(function (r) { console.log('  - ' + r.id + ' [' + r.year + '] opts=' + r.opts); });
if (dynamicFail.length) { console.log('动态选项解析失败(需人工看): ' + dynamicFail.length + ' -> ' + dynamicFail.slice(0,20).join(', ')); }
