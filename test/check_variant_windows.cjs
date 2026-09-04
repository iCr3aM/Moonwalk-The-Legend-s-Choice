// 变体年份窗口审计（常态化）：检测 (1) 同年 ≥4 变体的密集插入告警 (2) 同 flag 窗口重叠（硬错误） (3) window 不覆盖任何主线年份的"永不触发"告警
// 用法：node test/check_variant_windows.cjs  （npm test 调用；重叠冲突返回非零）
global.window = global;
var _store = {};
global.localStorage = {
  getItem: function (k) { return _store[k] != null ? _store[k] : null; },
  setItem: function (k, v) { _store[k] = String(v); },
  removeItem: function (k) { delete _store[k]; }
};
require('../js/config.js'); require('../js/state.js'); require('../js/engine.js'); require('../js/events.js'); require('../js/planner.js');
var MJ = global.MJ, EVENTS = MJ.EVENTS;

function flagsOf(ev) {
  var r = [];
  var opts = (typeof ev.options === 'function') ? [] : (ev.options || []);
  opts.forEach(function (o) { if (o.flags) r = r.concat(Object.keys(o.flags)); });
  return r;
}

var all = Object.keys(EVENTS).map(function (k) { return EVENTS[k]; }).filter(Boolean);
var mainlineYears = {};
all.forEach(function (ev) { if (!ev.variant && typeof ev.year === 'number') mainlineYears[ev.year] = true; });

var variants = all.filter(function (ev) { return ev.variant; }).map(function (ev) {
  return { id: ev.id, win: ev.window, weight: ev.weight, flags: flagsOf(ev) };
});

var errs = 0, warns = 0;
console.log('变体总数:', variants.length, '；主线事件年份数:', Object.keys(mainlineYears).length);

// (1) 同年密集插入（阈值 ≥4 → 告警）
var byYear = {};
variants.forEach(function (v) { if (!v.win) return; for (var y = v.win[0]; y <= v.win[1]; y++) { (byYear[y] = byYear[y] || []).push(v.id); } });
var dense = Object.keys(byYear).filter(function (y) { return byYear[y].length >= 4; }).sort(function (a, b) { return a - b; });
if (dense.length) { warns++; console.log('[告警·同年≥4变体·密集插入]', dense.map(function (y) { return y + '(' + byYear[y].join('/') + ')'; }).join('  ')); }
else console.log('[同年≥4变体] 无（✅）');

// (2) 同 flag 且窗口重叠（硬错误）
var flagMap = {};
variants.forEach(function (v) { v.flags.forEach(function (f) { (flagMap[f] = flagMap[f] || []).push(v); }); });
var conflict = [];
Object.keys(flagMap).forEach(function (f) {
  var arr = flagMap[f];
  for (var i = 0; i < arr.length; i++) for (var j = i + 1; j < arr.length; j++) {
    var a = arr[i], b = arr[j]; if (!a.win || !b.win) continue;
    if (a.id === b.id) continue; // 同一变体的多个选项写入同一 flag 属正常，不算冲突
    if (a.win[0] <= b.win[1] && b.win[0] <= a.win[1]) conflict.push(f + ': ' + a.id + '[' + a.win + '] ~ ' + b.id + '[' + b.win + ']');
  }
});
if (conflict.length) { errs += conflict.length; console.log('[错误·同flag窗口重叠·重复设标]'); conflict.forEach(function (c) { console.log('  ' + c); }); }
else console.log('[同flag窗口重叠] 无（✅）');

// (3) 永不触发：window 不覆盖任何主线事件年份
var never = variants.filter(function (v) { if (!v.win) return false; for (var y = v.win[0]; y <= v.win[1]; y++) { if (mainlineYears[y]) return false; } return true; });
if (never.length) { warns++; console.log('[告警·可能永不触发·window 无主线年] ' + never.map(function (v) { return v.id + '[' + (v.win ? v.win.join('-') : '-') + ']'; }).join('  ')); }
else console.log('[window覆盖主线年] 全部可达（✅）');

console.log('\n审计结束（告警 ' + warns + ' / 错误 ' + errs + '）');
process.exit(errs ? 1 : 0);
